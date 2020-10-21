import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import Orphanage from '../models/Orphanage';
import OrphanageView from '../views/orphanages_view';
import * as Yup from 'yup';
import orphanages_view from '../views/orphanages_view';

export default class OrphanagesController  {

    async index(_: Request, response: Response) {

        const orphanagesRepository = getRepository(Orphanage);
        const orphanages = await orphanagesRepository.find({
            relations: ['images']
        });

        return response.json(OrphanageView.renderMany(orphanages));
    }

    async show(request: Request, response: Response) {
        const { id } = request.params;
        const orphanagesRepository = getRepository(Orphanage);
        const orphanage = await orphanagesRepository.findOneOrFail(id, {
            relations: ['images']
        });
    
        return response.json(OrphanageView.render(orphanage));
    }

    async create (request: Request, response: Response) {

        const { name, latitude, longitude, about, whatsapp,
            instructions, opening_hours, open_on_weekends } = request.body;
    
        const orphanagesRepository = getRepository(Orphanage); 

        const data = { name, latitude, longitude, about,
            instructions, opening_hours, 
            open_on_weekends: open_on_weekends === 'true', 
            whatsapp
        };

        const schema = Yup.object().shape({
            name: Yup.string().required("Nome obrigatório"),
            latitude: Yup.number().required(),
            longitude: Yup.number().required(),
            about: Yup.string().required().max(300),
            instructions: Yup.string().required(),
            opening_hours: Yup.string().required(),
            open_on_weekends: Yup.boolean().required(),
            whatsapp: Yup.string().notRequired()
        });

        await schema.validate(data, { abortEarly: false });
        
        const orphanage = orphanagesRepository.create(data);

        await orphanagesRepository.save(orphanage);

        console.log(orphanage);
        
        return response.status(201).json(orphanage);
    }

    async updateImage (request: Request, response: Response) {

        const { id } = request.params;
           
        const orphanagesRepository = getRepository(Orphanage);

        const orphanage = await orphanagesRepository.findOneOrFail({
            where: { id }
          });

        console.log(id);

        const RequestImages = request.files as Express.Multer.File[];

        const images = RequestImages.map(image => {
            return {
              path: image.filename
            };
          })     

          const { name, latitude, longitude, about, whatsapp,
            instructions, opening_hours, open_on_weekends } = orphanage;

          const updateorphanage = { name, latitude, longitude, about,
            instructions, opening_hours, 
            open_on_weekends: open_on_weekends, 
            whatsapp, images
        };

        orphanagesRepository.save({
            ...orphanage, // existing fields
            ...updateorphanage // updated fields
          });

        console.log(orphanage);

        return response.status(201).json(orphanage);
    }

    async indexPending(req: Request, res: Response) {
        const orphanagesRespository = getRepository(Orphanage)

        const orphanages = await orphanagesRespository.find({
            where: {
                approved: false
            },
            relations: ['images']
        })

        return res.json(orphanages_view.renderMany(orphanages))
    }

    async approveOrphanage(req: Request, res: Response) {

        const { id } = req.params

        const orphanagesRepository = getRepository(Orphanage)

        const orphanage = await orphanagesRepository.findOne(id, {
            relations: ['images']
        })

        if(!orphanage) {
            return res.status(500).json({ message: "usuário não encontrado!" })
        }

        orphanage.permission = true

        await orphanagesRepository.save(orphanage)

        return res.status(200).json(orphanages_view.render(orphanage))

    }

    async updateOrphanage(req: Request, res: Response) {
        const { id } = req.params
        const { name, latitude, longitude, about, instructions, opening_hours, open_on_weekends } = req.body


        const data = { name, latitude, longitude, about, instructions, opening_hours, open_on_weekends }

        const schema = Yup.object().shape({
            name: Yup.string().required(),
            latitude: Yup.number().required(),
            longitude: Yup.number().required(),
            about: Yup.string().required(),
            instructions: Yup.string().required(),
            opening_hours: Yup.string().required(),
            open_on_weekends: Yup.boolean().required()
        })

      
        await schema.validate(data, {
            abortEarly: false
        })

        const orphanagesRepository = getRepository(Orphanage)

        const orphanage = await orphanagesRepository.findOne(id)

        if(!orphanage) {
            return res.status(500).json({ message: "Orphanage not found" })
        }

        orphanage.name = name
        orphanage.latitude = latitude
        orphanage.longitude = longitude
        orphanage.about = about
        orphanage.instructions = instructions
        orphanage.opening_hours= opening_hours
        orphanage.open_on_weekends = open_on_weekends

        await orphanagesRepository.save(orphanage)

        return res.status(200).json(orphanage)
    }


    async deleteOrphanage(req: Request, res: Response) {
        const { id } = req.params

        const orphanagesRepository = getRepository(Orphanage)

        const orphanage = await orphanagesRepository.findOne(id)

        if(!orphanage) {
            return res.status(500).json({ message: "User not found" })
        }

        await orphanagesRepository.delete(orphanage)

        return res.status(200).json({ message: "Orphanage successfully deleted!" })
    }
}
















// export default {
//     async index(_: Request, response: Response) {
//         const orphanagesRepository = getRepository(Orphanage);
//         const orphanages = await orphanagesRepository.find({
//             relations: ['images']
//         });

//         return response.json(OrphanageView.renderMany(orphanages));
//     },

//     async show(request: Request, response: Response) {
//         const { id } = request.params;
//         const orphanagesRepository = getRepository(Orphanage);
//         const orphanage = await orphanagesRepository.findOneOrFail(id, {
//             relations: ['images']
//         });
        
//         return response.json(OrphanageView.render(orphanage));
//     },

//     async create (request: Request, response: Response) {

//         const { 
//             name,
//             latitude,
//             longitude,
//             about,
//             instructions,
//             opening_hours,
//             open_on_weekends,
//          } = request.body;
    
//         const orphanagesRepository = getRepository(Orphanage);

//         // const requestImages = request.files as Express.Multer.File[];

//         // const images = requestImages.map(image => {
//         //     return { path: image.filename }
//         // });

//         const data = {
//             name,
//             latitude,
//             longitude,
//             about,
//             instructions,
//             opening_hours,
//             open_on_weekends: JSON.parse(open_on_weekends)
//         };
        
//         const orphanage = orphanagesRepository.create(data);
    
//         await orphanagesRepository.save(orphanage);
    
//         return response.status(201).json(orphanage);
//     }
// }