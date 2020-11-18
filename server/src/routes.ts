import { Router } from 'express';
import multer from 'multer';
import OrphanagesController from './controllers/OrphanagesControllers';
import UsersController from './controllers/UsersController';
import uploadConfig from './config/multerConfig';
import auth from './middlewares/auth'

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

routes.get('/orphanages', orphanagesController.index);
routes.post('/orphanages', orphanagesController.create);

routes.get('/indexPending/:ok', auth, orphanagesController.indexPending);
routes.get('/orphanages/:id', orphanagesController.show);

routes.delete('/orphanages/delete/:id', auth, orphanagesController.deleteOrphanage)
routes.put('/orphanages/update/:id', auth, orphanagesController.updateOrphanage)

routes.put('/orphanages/deleteimages/:id', orphanagesController.deleteimages)
routes.put('/orphanages/images/:id', upload.array('images'), orphanagesController.updateImage)

export default routes;