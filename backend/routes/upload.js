const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const slugify = require('slugify'); // We will just use a simple function or require it if installed

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // We need the module title to create the folder.
        // It should be passed in the body.
        const moduleTitle = req.body.moduleTitle || 'default';
        
        // Slugify the title for safe folder name
        const slug = slugify(moduleTitle, { lower: true, strict: true, locale: 'en' }) || 'misc';
        
        const uploadPath = path.join(__dirname, '../../pronounce', slug);
        
        // Ensure directory exists
        fs.ensureDirSync(uploadPath);
        
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Keep original name but maybe clean it up?
        // Or timestamp it to avoid cache issues?
        // User wants "module link", let's keep it simple.
        // Let's prepend timestamp to ensure uniqueness if they upload same file content
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

// Upload Endpoint
router.post('/upload-audio', upload.single('audio'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        // Construct the public URL
        // We know server serves /pronounce mapped to backend/pronounce
        // The file path is `backend/pronounce/slug/filename`
        // So URL is `/pronounce/slug/filename`
        
        // Get slug from path (re-derive or extract)
        // Since we created it in destination, let's extract relative path
        const relativePath = path.relative(path.join(__dirname, '../../pronounce'), req.file.path);
        
        // Use forward slashes for URL
        const publicUrl = '/pronounce/' + relativePath.split(path.sep).join('/');
        
        res.json({ 
            url: publicUrl,
            message: 'File uploaded successfully' 
        });
    } catch (e) {
        res.status(500).json({ error: 'Failed to process upload' });
    }
});

module.exports = router;
