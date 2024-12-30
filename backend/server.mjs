import express from 'express';
import Joi from 'joi';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { supabase } from './supabase.js';

const SECRET_KEY = 'b92f50473b98eb62c0cfd4b1a342f2430f92e0f01e4c7a9e6fe22a788c72e04d';
const PORT = 5000;

if (!SECRET_KEY) {
    console.error('Missing SECRET_KEY in environment variables.');
    process.exit(1);
}

const app = express();

// Middleware setup
app.use(cors({
    origin: 'http://localhost:8081', // Frontend URL
}));
app.use(express.json());

// Schema validation
const postSchema = Joi.object({
    title: Joi.string().required(),
    content: Joi.string().required(),
    userId: Joi.string().required(),
});

const userUpdateSchema = Joi.object({
    username: Joi.string().optional(),
    email: Joi.string().email().optional(),
    image: Joi.string().uri().optional(),
});

const userSignUpSchema = Joi.object({
    username: Joi.string().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

const userLoginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

// Middleware for JWT verification
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.replace('Bearer ', '');
    if (!token) {
        return res.status(403).json({ success: false, message: 'No token provided' });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
        req.user = decoded; // Attach user data to request
        next();
    });
};


// Cấu hình multer để lưu trữ tệp tải lên
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Thư mục lưu trữ tệp
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Tên tệp lưu trữ
    }
});

// Khởi tạo middleware upload với multer
const upload = multer({ storage });

// Routes

app.get('/api/auth/session', verifyToken, async (req, res) => {
    try {
        const { userId } = req.user;  // 'req.user' chứa thông tin người dùng đã được xác thực

        // Lấy thông tin người dùng từ cơ sở dữ liệu Supabase
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            // Log lỗi chi tiết và trả về thông báo cho client
            console.error('Supabase error:', error);
            return res.status(500).json({ success: false, msg: 'Error fetching user data' });
        }

        if (!data) {
            return res.status(404).json({ success: false, msg: 'User not found' });
        }

        // Loại bỏ mật khẩu và các thông tin nhạy cảm
        const { password, ...userWithoutPassword } = data;

        // Trả về thông tin người dùng
        res.json({ success: true, user: userWithoutPassword });
    } catch (err) {
        // Log lỗi để dễ dàng debug
        console.error('Error fetching session:', err);
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

// API lấy ảnh người dùng
app.get('/api/user-image', (req, res) => {
    const imagePath = req.query.imagePath;

    if (imagePath) {
        return res.json({ uri: `${supabaseUrl}/storage/v1/object/public/uploads/${imagePath}` });
    } else {
        return res.json({ uri: 'D:\SocialApp\frontend\assets\images\defaultUser.png' }); // Đường dẫn ảnh mặc định
    }
});

// API tải tệp lên
app.post('/api/upload', upload.single('file'), async (req, res) => {
    const file = req.file;
    const { folderName, isImage } = req.body;

    try {
        if (!file) {
            return res.status(400).json({ success: false, msg: 'No file uploaded' });
        }

        const fileName = getFilePath(folderName, isImage);
        const fileBase64 = await FileSystem.readAsStringAsync(file.path, { encoding: FileSystem.EncodingType.Base64 });
        const imageData = decode(fileBase64);

        const { data, error } = await supabase
            .storage
            .from('uploads')
            .upload(fileName, imageData, {
                cacheControl: '3600',
                upsert: false,
                contentType: isImage ? 'image/*' : 'video/*'
            });

        if (error) {
            console.log('File upload error:', error);
            return res.status(500).json({ success: false, msg: 'Could not upload media' });
        }

        res.json({ success: true, data: data.path });
    } catch (error) {
        console.log('File upload error:', error);
        res.status(500).json({ success: false, msg: 'Could not upload media' });
    }
});

// API tải tệp xuống
app.get('/api/download', async (req, res) => {
    const url = req.query.url;

    try {
        const fileUri = await downloadFile(url);
        if (fileUri) {
            res.json({ success: true, uri: fileUri });
        } else {
            res.status(500).json({ success: false, msg: 'Could not download file' });
        }
    } catch (error) {
        res.status(500).json({ success: false, msg: 'Server error during file download' });
    }
});

// API trả về đường dẫn tệp địa phương
app.get('/api/local-file-path', (req, res) => {
    const filePath = req.query.filePath;
    const localFilePath = getLocalFilePath(filePath);
    res.json({ path: localFilePath });
});

// Hàm để lấy đường dẫn tệp địa phương
const getLocalFilePath = filePath => {
    let fileName = filePath.split('/').pop();
    return `${FileSystem.documentDirectory}${fileName}`;
};

// Hàm để tạo đường dẫn tệp
const getFilePath = (folderName, isImage) => {
    return `${folderName}/${(new Date()).getTime()}${isImage ? '.png' : '.mp4'}`;
};

// Hàm tải xuống tệp
const downloadFile = async (url) => {
    try {
        const { uri } = await FileSystem.downloadAsync(url, getLocalFilePath(url));
        return uri;
    } catch (error) {
        return null;
    }
};
// Tạo hoặc cập nhật bài viết
app.post('/api/posts', async (req, res) => {
    const { post } = req.body;
    try {
        if (post.file && typeof post.file === 'object') {
            let isImage = post?.file?.type === 'image';
            let folderName = isImage ? 'postImages' : 'postVideos';
            let fileResult = await uploadFile(folderName, post?.file?.uri, isImage);
            if (fileResult.success) post.file = fileResult.data;
            else {
                return res.status(500).json(fileResult);
            }
        }
        
        const { data, error } = await supabase
            .from('posts')
            .upsert(post)
            .select()
            .single();

        if (error) {
            console.log('createPost error: ', error);
            return res.status(500).json({ success: false, msg: 'Could not create your post' });
        }
        res.json({ success: true, data });
    } catch (error) {
        console.log('createPost error: ', error);
        res.status(500).json({ success: false, msg: 'Could not create your post' });
    }
});

// Lấy các bài viết
app.get('/api/posts', async (req, res) => {
    const { limit = 10, userId } = req.query;
    try {
        let query = supabase
            .from('posts')
            .select(
                '*, user:users(id, name, image), postLikes(*), comments(count)'
            )
            .order('created_at', { ascending: false })
            .limit(limit);

        if (userId) {
            query = query.eq('userId', userId);
        }

        const { data, error } = await query;

        if (error) {
            console.log('fetchPosts error: ', error);
            return res.status(500).json({ success: false, msg: 'Could not fetch the posts' });
        }
        res.json({ success: true, data });
    } catch (error) {
        console.log('fetchPosts error: ', error);
        res.status(500).json({ success: false, msg: 'Could not fetch the posts' });
    }
});

// Tạo bài viết thích
app.post('/api/post-likes', async (req, res) => {
    const { postLike } = req.body;
    try {
        const { data, error } = await supabase
            .from('postLikes')
            .insert(postLike)
            .select()
            .single();

        if (error) {
            console.log('postLike error: ', error);
            return res.status(500).json({ success: false, msg: 'Could not like the post' });
        }
        res.json({ success: true, data });
    } catch (error) {
        console.log('postLike error: ', error);
        res.status(500).json({ success: false, msg: 'Could not like the post' });
    }
});

// Xóa bài viết thích
app.delete('/api/post-likes', async (req, res) => {
    const { postId, userId } = req.body;
    try {
        const { data, error } = await supabase
            .from('postLikes')
            .delete()
            .eq('userId', userId)
            .eq('postId', postId);

        if (error) {
            console.log('removePostLike error: ', error);
            return res.status(500).json({ success: false, msg: 'Could not remove the post like' });
        }
        res.json({ success: true, data });
    } catch (error) {
        console.log('removePostLike error: ', error);
        res.status(500).json({ success: false, msg: 'Could not remove the post like' });
    }
});

// Lấy chi tiết bài viết
app.get('/api/posts/:postId', async (req, res) => {
    const { postId } = req.params;
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(
                '*, user:users(id, name, image), postLikes(*), comments(*, user:users(id, name, image))'
            )
            .eq('id', postId)
            .order('created_at', { ascending: false, foreignTable: 'comments' })
            .single();

        if (error) {
            console.log('fetchPostDetails error: ', error);
            return res.status(500).json({ success: false, msg: 'Could not fetch the post' });
        }
        res.json({ success: true, data });
    } catch (error) {
        console.log('fetchPostDetails error: ', error);
        res.status(500).json({ success: false, msg: 'Could not fetch the post' });
    }
});

// Tạo bình luận
app.post('/api/comments', async (req, res) => {
    const { comment } = req.body;
    try {
        const { data, error } = await supabase
            .from('comments')
            .insert(comment)
            .select()
            .single();

        if (error) {
            console.log('comment error: ', error);
            return res.status(500).json({ success: false, msg: 'Could not create your comment' });
        }
        res.json({ success: true, data });
    } catch (error) {
        console.log('comment error: ', error);
        res.status(500).json({ success: false, msg: 'Could not create your comment' });
    }
});

// Xóa bình luận
app.delete('/api/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;
    try {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', commentId);

        if (error) {
            console.log('removeComment error: ', error);
            return res.status(500).json({ success: false, msg: 'Could not remove the comment' });
        }
        res.json({ success: true, data: { commentId } });
    } catch (error) {
        console.log('removeComment error: ', error);
        res.status(500).json({ success: false, msg: 'Could not remove the comment' });
    }
});

// Xóa bài viết
app.delete('/api/posts/:postId', async (req, res) => {
    const { postId } = req.params;
    try {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', postId);

        if (error) {
            console.log('removePost error: ', error);
            return res.status(500).json({ success: false, msg: 'Could not remove the post' });
        }
        res.json({ success: true, data: { postId } });
    } catch (error) {
        console.log('removePost error: ', error);
        res.status(500).json({ success: false, msg: 'Could not remove the post' });
    }
});


app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;

    const { error } = userSignUpSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, msg: error.details[0].message });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const { data, error: insertError } = await supabase
            .from('users')
            .insert([{ username, email, password: hashedPassword }]);

        if (insertError) {
            return res.status(400).json({ success: false, msg: insertError.message });
        }

        res.json({ success: true, msg: 'User created successfully' });
    } catch (err) {
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const { error } = userLoginSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, msg: error.details[0].message });
    }

    try {
        const { data, error: fetchError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (fetchError || !data) {
            return res.status(400).json({ success: false, msg: 'Invalid email or password' });
        }

        const passwordMatch = await bcrypt.compare(password, data.password);
        if (!passwordMatch) {
            return res.status(400).json({ success: false, msg: 'Invalid email or password' });
        }

        const { password: _, ...userWithoutPassword } = data;
        const token = jwt.sign({ userId: data.id, email: data.email }, SECRET_KEY, { expiresIn: '1h' });

        res.json({ success: true, msg: 'Login successful', token, user: userWithoutPassword });
    } catch (err) {
        res.status(500).json({ success: false, msg: 'Server Error' });
    }
});

app.get('/api/profile', verifyToken, (req, res) => {
    res.json({ success: true, user: req.user });
});

// Tạo thông báo
app.post('/api/notifications', async (req, res) => {
    const { notification } = req.body;

    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert(notification)
            .select()
            .single();

        if (error) {
            console.log('Notification creation error: ', error);
            return res.status(500).json({ success: false, msg: 'Something went wrong' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.log('Post notification error: ', error);
        res.status(500).json({ success: false, msg: 'Something went wrong' });
    }
});

// Lấy danh sách thông báo của người nhận
app.get('/api/notifications', async (req, res) => {
    const { receiverId } = req.query;  // Lấy receiverId từ query parameters

    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*, sender:senderId(id, name, image)')
            .eq('receiverId', receiverId)
            .order('created_at', { ascending: false });

        if (error) {
            console.log('Fetch notifications error: ', error);
            return res.status(500).json({ success: false, msg: 'Could not fetch notifications' });
        }

        res.json({ success: true, data });
    } catch (error) {
        console.log('Fetch notifications error: ', error);
        res.status(500).json({ success: false, msg: 'Could not fetch notifications' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
