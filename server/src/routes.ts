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

routes.get('/orphanages', orphanagesController.index);
routes.get('/orphanages/:id', orphanagesController.show);
routes.post('/orphanages', orphanagesController.create);
routes.put('/orphanages/:id', upload.array('images'), orphanagesController.updateImage)

routes.delete('/orphanages/delete/:id', auth, orphanagesController.deleteOrphanage)
routes.put('/orphanages/update/:id', auth, orphanagesController.updateOrphanage)
routes.put('/orphanages/approve/:id', auth, orphanagesController.approveOrphanage)
routes.get('/orphanages/pending', auth, orphanagesController.indexPending)

export default routes;