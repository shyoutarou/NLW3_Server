import multer from 'multer';
import path from 'path';

export default {

       
    storage: multer.diskStorage({
        destination: path.join(__dirname, '..', '..', 'uploads'),
        filename: (request, file, cb) => {
            const filenName = `${Date.now()}-${file.originalname}`;
            cb(null, filenName);
        },
    }),
    limits: {
        fileSize: 2*1024*1024
    },
    fileFilter: function (req: any, file: any, cb: any) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'));
        }
        cb(null, true);
      }
};