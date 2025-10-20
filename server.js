const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static fayllar üçün middleware
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Upload qovluğunu yoxla/yarat
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Uploads qovluğu yaradıldı:', uploadsDir);
}

// Fayl saxlanması üçün konfiqurasiya
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const originalNameWithoutExt = path.basename(file.originalname, fileExtension);
        cb(null, originalNameWithoutExt + '-' + uniqueSuffix + fileExtension);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx'];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(fileExtension)) {
            cb(null, true);
        } else {
            cb(new Error('Yalnız PDF və Word fayllarına icazə verilir!'), false);
        }
    }
});

// Məlumatların saxlanması
let fileData = {
    transport: { lecture: [], colloquium: [], seminar: [] },
    computer: { lecture: [], colloquium: [], seminar: [] },
    math: { lecture: [], colloquium: [], seminar: [] },
    economics: { lecture: [], colloquium: [], seminar: [] },
    azerbaijani: { lecture: [], colloquium: [], seminar: [] },
    english: { lecture: [], colloquium: [], seminar: [] },
    physical: { lecture: [], colloquium: [], seminar: [] },
    pedagogy: { lecture: [], colloquium: [], seminar: [] },
    agriculture: { lecture: [], colloquium: [], seminar: [] },
    history: { lecture: [], colloquium: [], seminar: [] }
};

// Müəllim giriş məlumatları
let teacherCredentials = {
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
};

// Modul giriş məlumatları
let moduleCredentials = {
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
};

// Məlumatları fayldan oxu/yadda saxla
const dataFile = path.join(__dirname, 'data.json');

function loadData() {
    try {
        if (fs.existsSync(dataFile)) {
            const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
            fileData = data.fileData || fileData;
            teacherCredentials = data.teacherCredentials || teacherCredentials;
            moduleCredentials = data.moduleCredentials || moduleCredentials;
            console.log('💾 Məlumatlar fayldan yükləndi');
        }
    } catch (error) {
        console.error('Məlumatları yükləmə xətası:', error);
    }
}

function saveData() {
    try {
        const data = {
            fileData,
            teacherCredentials,
            moduleCredentials
        };
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
        console.log('💾 Məlumatlar saxlandı');
    } catch (error) {
        console.error('Məlumatları saxlamada xəta:', error);
    }
}

// İlkin məlumatları yüklə
loadData();

// API Routes

// Server status
app.get('/api/status', (req, res) => {
    res.json({ 
        status: 'Server işləyir! 🚀', 
        message: 'Ağdam Dövlət Sosial-İqtisadi Kolleci Backend',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Ümumi məlumatlar
app.get('/api/data', (req, res) => {
    res.json(fileData);
});

// Müəllim məlumatları
app.get('/api/teachers', (req, res) => {
    res.json(teacherCredentials);
});

// Modul məlumatları
app.get('/api/modules', (req, res) => {
    res.json(moduleCredentials);
});

// Faylları əldə et
app.get('/api/files/:subject/:module', (req, res) => {
    const { subject, module } = req.params;
    
    if (!fileData[subject] || !fileData[subject][module]) {
        return res.json([]);
    }
    
    res.json(fileData[subject][module]);
});

// Müəllim fayllarını əldə et
app.get('/api/teacher-files/:subject', (req, res) => {
    const { subject } = req.params;
    
    if (!fileData[subject]) {
        return res.json({});
    }
    
    res.json(fileData[subject]);
});

// Modul girişi
app.post('/api/module-login', (req, res) => {
    const { subject, username, password } = req.body;
    
    if (moduleCredentials[subject] && 
        moduleCredentials[subject].username === username && 
        moduleCredentials[subject].password === password) {
        res.json({ success: true });
    } else {
        res.json({ success: false });
    }
});

// Müəllim girişi
app.post('/api/teacher-login', (req, res) => {
    const { username, password } = req.body;
    
    if (teacherCredentials[username] && teacherCredentials[username].password === password) {
        res.json({ 
            success: true, 
            subject: teacherCredentials[username].subject 
        });
    } else {
        res.json({ success: false });
    }
});

// Fayl yükləmə
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Fayl yüklənmədi' });
        }

        const { subject, module, type } = req.body;
        
        if (!subject || !module) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Subject və module tələb olunur' });
        }

        // Fayl məlumatını yadda saxla
        const fileInfo = {
            id: Date.now(),
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            type: type || (req.file.originalname.toLowerCase().endsWith('.pdf') ? 'pdf' : 'word'),
            uploadedAt: new Date().toISOString(),
            downloadUrl: `/uploads/${req.file.filename}`
        };

        // Data strukturunu yoxla/yarat
        if (!fileData[subject]) {
            fileData[subject] = { lecture: [], colloquium: [], seminar: [] };
        }
        if (!fileData[subject][module]) {
            fileData[subject][module] = [];
        }

        fileData[subject][module].push(fileInfo);
        saveData();

        console.log(`📤 Fayl yükləndi: ${req.file.originalname} -> ${subject}/${module}`);

        res.json({ 
            success: true, 
            message: 'Fayl uğurla yükləndi!',
            filename: req.file.filename,
            file: fileInfo
        });

    } catch (error) {
        console.error('Yükləmə xətası:', error);
        res.status(500).json({ error: 'Fayl yükləmə xətası: ' + error.message });
    }
});

// Şifrə yeniləmə
app.post('/api/update-password', (req, res) => {
    const { teacher, currentPassword, newPassword } = req.body;
    
    if (teacherCredentials[teacher] && teacherCredentials[teacher].password === currentPassword) {
        teacherCredentials[teacher].password = newPassword;
        saveData();
        res.json({ success: true });
    } else {
        res.json({ success: false, error: 'Hazırki şifrə yanlışdır' });
    }
});

// Fayl adını yenilə
app.post('/api/update-filename', (req, res) => {
    const { fileId, module, subject, newName } = req.body;
    
    try {
        if (fileData[subject] && fileData[subject][module]) {
            const fileIndex = fileData[subject][module].findIndex(f => f.id == fileId);
            if (fileIndex !== -1) {
                fileData[subject][module][fileIndex].originalname = newName;
                saveData();
                return res.json({ success: true });
            }
        }
        res.json({ success: false, error: 'Fayl tapılmadı' });
    } catch (error) {
        res.json({ success: false, error: 'Xəta baş verdi' });
    }
});

// Faylı sil
app.post('/api/delete-file', (req, res) => {
    const { fileId, module, subject } = req.body;
    
    try {
        if (fileData[subject] && fileData[subject][module]) {
            const fileIndex = fileData[subject][module].findIndex(f => f.id == fileId);
            if (fileIndex !== -1) {
                const file = fileData[subject][module][fileIndex];
                
                // Fiziki faylı sil
                try {
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                        console.log(`🗑️ Fayl silindi: ${file.path}`);
                    }
                } catch (fileError) {
                    console.error('Faylı silmə xətası:', fileError);
                }
                
                // Data-dan sil
                fileData[subject][module].splice(fileIndex, 1);
                saveData();
                
                return res.json({ success: true });
            }
        }
        res.json({ success: false, error: 'Fayl tapılmadı' });
    } catch (error) {
        res.json({ success: false, error: 'Xəta baş verdi' });
    }
});

// Əsas səhifə
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="az">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ağdam Dövlət Sosial-İqtisadi Kolleci</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 0;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 15px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    text-align: center;
                    max-width: 700px;
                }
                h1 {
                    color: #2c3e50;
                    margin-bottom: 20px;
                }
                .status {
                    background: #e8f5e8;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .success {
                    color: #27ae60;
                    font-weight: bold;
                }
                .info {
                    background: #e3f2fd;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 15px 0;
                }
                .endpoints {
                    text-align: left;
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                }
                code {
                    background: #2c3e50;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                }
                .features {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                    margin: 20px 0;
                }
                .feature {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎓 Ağdam Dövlət Sosial-İqtisadi Kolleci</h1>
                
                <div class="status">
                    <h2 class="success">✅ Tam Backend Server İşləyir</h2>
                    <p><strong>Port:</strong> ${PORT}</p>
                    <p><strong>Zaman:</strong> ${new Date().toLocaleString('az-AZ')}</p>
                    <p><strong>Status:</strong> <span class="success">Bütün funksionallıq aktiv</span></p>
                </div>

                <div class="features">
                    <div class="feature">
                        <h3>📁 Fayl Yükləmə</h3>
                        <p>PDF & Word faylları</p>
                    </div>
                    <div class="feature">
                        <h3>👨‍🏫 Müəllim Girişi</h3>
                        <p>Şəxsi kabinet</p>
                    </div>
                    <div class="feature">
                        <h3>🔐 Modul Kilidləri</h3>
                        <p>Təhlükəsiz giriş</p>
                    </div>
                    <div class="feature">
                        <h3>📊 Real-time Data</h3>
                        <p>Dinamik məlumatlar</p>
                    </div>
                </div>

                <div class="endpoints">
                    <h3>📡 API Endpoints:</h3>
                    <ul>
                        <li><code>GET /api/status</code> - Server statusu</li>
                        <li><code>GET /api/data</code> - Fayl məlumatları</li>
                        <li><code>POST /api/upload</code> - Fayl yükləmə</li>
                        <li><code>GET /api/files/:subject/:module</code> - Faylları əldə et</li>
                        <li><code>POST /api/teacher-login</code> - Müəllim girişi</li>
                        <li><code>POST /api/module-login</code> - Modul girişi</li>
                    </ul>
                    
                    <p style="margin-top: 15px; text-align: center;">
                        <a href="/api/status" style="color: #3498db; text-decoration: none; font-weight: bold; margin-right: 15px;">
                            🔗 API Status
                        </a>
                        <a href="/api/data" style="color: #3498db; text-decoration: none; font-weight: bold;">
                            📊 Data Yoxla
                        </a>
                    </p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// Xəta idarəetmə middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Fayl ölçüsü çox böyükdür (maksimum 10MB)' });
        }
    }
    res.status(500).json({ error: error.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tapılmadı' });
});

// Serveri başlat
app.listen(PORT, () => {
    console.log(`🚀 Server http://localhost:${PORT} ünvanında işləyir`);
    console.log('✅ Tam backend hazırdır!');
    console.log(`📊 API Status: http://localhost:${PORT}/api/status`);
    console.log(`📁 Upload qovluğu: ${uploadsDir}`);
    console.log(`💾 Data faylı: ${dataFile}`);
});