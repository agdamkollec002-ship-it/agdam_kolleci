const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Render.com xüsusi tənzimləmələri
const isRender = process.env.RENDER === 'true';
const UPLOADS_DIR = isRender ? '/tmp/uploads' : path.join(__dirname, 'uploads');
const DATA_FILE = isRender ? '/tmp/data.json' : path.join(__dirname, 'data.json');

// Middleware
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost',
        'http://127.0.0.1',
        'file://',
        'https://agdam-college.onrender.com', // Render URL-nizi əlavə edin
        'https://*.onrender.com' // Bütün Render subdomain-ləri
    ],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOADS_DIR));

// Əgər Render-də işləyiriksə, uploads qovluğunu yoxla
if (isRender) {
    if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        console.log('Uploads directory created in /tmp');
    }
}

// Initialize data file if it doesn't exist
function initializeDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            files: {},
            teachers: {
                'Nəqliyyat': { password: 'pass1234', subject: 'transport' },
                'Kompyuter sistemləri': { password: 'pass1234', subject: 'computer' },
                'Riyaziyyat': { password: 'pass1234', subject: 'math' },
                'İqtisadiyyat': { password: 'pass1234', subject: 'economics' },
                'Azərbaycan dili': { password: 'pass1234', subject: 'azerbaijani' },
                'İngilis dili': { password: 'pass1234', subject: 'english' },
                'Fiziki tərbiyə': { password: 'pass1234', subject: 'physical' },
                'Pedaqogika': { password: 'pass1234', subject: 'pedagogy' },
                'Kənd təsərrüfatı': { password: 'pass1234', subject: 'agriculture' },
                'Tarix': { password: 'pass1234', subject: 'history' }
            },
            modules: {
                'transport': { username: 'neqliyyat', password: 'pass1234' },
                'computer': { username: 'kompyuter', password: 'pass1234' },
                'math': { username: 'riyaziyyat', password: 'pass1234' },
                'economics': { username: 'iqtisadiyyat', password: 'pass1234' },
                'azerbaijani': { username: 'azdili', password: 'pass1234' },
                'english': { username: 'ingilisdili', password: 'pass1234' },
                'physical': { username: 'fiziki', password: 'pass1234' },
                'pedagogy': { username: 'pedagogiya', password: 'pass1234' },
                'agriculture': { username: 'kend', password: 'pass1234' },
                'history': { username: 'tarix', password: 'pass1234' }
            }
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('New data file created with empty structure');
    }
    console.log('Data file initialized at:', DATA_FILE);
}

// Read data from JSON file
function readData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            initializeDataFile();
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data file:', error);
        return null;
    }
}

// Write data to JSON file
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data file:', error);
        return false;
    }
}

// Configure multer for file uploads - Render üçün xüsusi
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        const cleanName = file.originalname.replace(/[^\w\u0130\u0131\u015E\u015F\u00C7\u00E7\u011E\u011F\u00DC\u00FC\u00D6\u00F6\u0130\u0131\.\- ]/g, '');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(cleanName);
        const baseName = path.basename(cleanName, fileExtension);
        cb(null, baseName + '-' + uniqueSuffix + fileExtension);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and Word files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    },
    fileFilter: fileFilter
});

// Initialize data file on server start
initializeDataFile();

// ========== API ROUTES ==========

// Test endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Agdam College File Sharing System API',
        status: 'running',
        environment: isRender ? 'Render' : 'Local',
        timestamp: new Date().toISOString(),
        uploadsDir: UPLOADS_DIR
    });
});

// Server status
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'Server is running', 
        environment: isRender ? 'Render' : 'Local',
        timestamp: new Date().toISOString(),
        dataFile: fs.existsSync(DATA_FILE) ? 'exists' : 'missing',
        uploadsDir: fs.existsSync(UPLOADS_DIR) ? 'exists' : 'missing',
        port: PORT
    });
});

// Get all data
app.get('/api/data', (req, res) => {
    try {
        const data = readData();
        if (data && data.files) {
            res.json(data.files);
        } else {
            res.json({});
        }
    } catch (error) {
        console.error('Error in /api/data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get files for specific subject and module
app.get('/api/files/:subject/:module', (req, res) => {
    try {
        const { subject, module } = req.params;
        const data = readData();
        
        if (data && data.files && data.files[subject] && data.files[subject][module]) {
            // Fayl URL-lərini tam absolute edirik
            const files = data.files[subject][module].map(file => ({
                ...file,
                downloadUrl: `${req.protocol}://${req.get('host')}${file.downloadUrl}`
            }));
            res.json(files);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('Error in /api/files:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get teacher files
app.get('/api/teacher-files/:subject', (req, res) => {
    try {
        const { subject } = req.params;
        const data = readData();
        
        if (data && data.files && data.files[subject]) {
            const modulesWithFiles = {};
            for (const module in data.files[subject]) {
                if (data.files[subject][module].length > 0) {
                    modulesWithFiles[module] = data.files[subject][module].map(file => ({
                        ...file,
                        downloadUrl: `${req.protocol}://${req.get('host')}${file.downloadUrl}`
                    }));
                }
            }
            res.json(modulesWithFiles);
        } else {
            res.json({});
        }
    } catch (error) {
        console.error('Error in /api/teacher-files:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// File upload
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        console.log('Upload request received:', req.body);
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { subject, module, type } = req.body;
        
        if (!subject || !module || !type) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: 'Subject, module, and type are required' });
        }

        const data = readData();
        if (!data) {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(500).json({ error: 'Failed to read data' });
        }

        // Initialize files object if it doesn't exist
        if (!data.files) {
            data.files = {};
        }

        // Initialize subject if it doesn't exist
        if (!data.files[subject]) {
            data.files[subject] = {};
        }

        // Initialize module if it doesn't exist
        if (!data.files[subject][module]) {
            data.files[subject][module] = [];
        }

        // Create file object with full URL
        const fileObj = {
            id: Date.now().toString(),
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            uploadedAt: new Date().toISOString(),
            downloadUrl: `/uploads/${req.file.filename}`,
            type: type,
            size: req.file.size,
            subject: subject,
            module: module
        };

        // Add file to the appropriate module
        data.files[subject][module].push(fileObj);

        // Save data
        if (writeData(data)) {
            console.log('File uploaded successfully:', fileObj.filename);
            res.json({
                success: true,
                message: 'File uploaded successfully',
                filename: req.file.filename,
                file: {
                    ...fileObj,
                    downloadUrl: `${req.protocol}://${req.get('host')}${fileObj.downloadUrl}`
                }
            });
        } else {
            if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            res.status(500).json({ error: 'Failed to save file data' });
        }
    } catch (error) {
        console.error('Upload error:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'File upload failed: ' + error.message });
    }
});

// ... (qalan endpointlər eyni qalır, yuxarıdakı kimi)

// Delete file
app.delete('/api/delete/:subject/:module/:id', (req, res) => {
    try {
        const { subject, module, id } = req.params;
        const data = readData();
        
        if (!data || !data.files || !data.files[subject] || !data.files[subject][module]) {
            return res.status(404).json({ error: 'File not found' });
        }

        const fileIndex = data.files[subject][module].findIndex(file => file.id === id);
        
        if (fileIndex === -1) {
            return res.status(404).json({ error: 'File not found' });
        }

        const file = data.files[subject][module][fileIndex];
        
        // Delete physical file
        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        // Remove from data
        data.files[subject][module].splice(fileIndex, 1);

        // Clean up empty modules and subjects
        if (data.files[subject][module].length === 0) {
            delete data.files[subject][module];
            if (Object.keys(data.files[subject]).length === 0) {
                delete data.files[subject];
            }
        }

        if (writeData(data)) {
            res.json({ success: true, message: 'File deleted successfully' });
        } else {
            res.status(500).json({ error: 'Failed to update data' });
        }
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'File deletion failed' });
    }
});

// Teacher login, Module login, Update filename, Update password endpointləri...
// (Bu endpointlər əvvəlki kimi eyni qalır)

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        requestedUrl: req.originalUrl,
        environment: isRender ? 'Render' : 'Local'
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size too large. Maximum 10MB allowed.' });
        }
    }
    
    if (error.message === 'Only PDF and Word files are allowed!') {
        return res.status(400).json({ error: error.message });
    }
    
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🌍 Environment: ${isRender ? 'Render' : 'Local'}`);
    console.log(`📁 Uploads directory: ${UPLOADS_DIR}`);
    console.log(`💾 Data file: ${DATA_FILE}`);
    console.log(`🔗 API Base URL: http://localhost:${PORT}`);
});
