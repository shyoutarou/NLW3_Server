import { Router } from 'express';
import multer from 'multer';
import OrphanagesController from './controllers/OrphanagesControllers';
import UsersController from './controllers/UsersController';
import uploadConfig from './config/multerConfig';


const routes = Router();
const upload = multer(uploadConfig);

const usersController = new UsersController();
const orphanagesController = new OrphanagesController();

routes.get('/users', usersController.listUsers)
routes.post('/users', usersController.create)

routes.post('/gerartoken', usersController.gerartokenTestes)
routes.post('/auth', usersController.login)
routes.post('/forgotPassword', usersController.forgotPassword)
routes.post('/resetPassword/:id', usersController.resetPassword)

import auth from './middlewares/auth'

routes.get('/orphanages', auth, orphanagesController.index);
routes.get('/orphanages/:id', auth, orphanagesController.show);
routes.post('/orphanages', auth, orphanagesController.create);
routes.put('/orphanages/:id', auth, upload.array('images'), orphanagesController.updateImage)

export default routes;