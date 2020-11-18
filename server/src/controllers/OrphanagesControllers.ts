import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import Orphanage from '../models/Orphanage';
import ImageMod from '../models/Image';
import OrphanageView from '../views/orphanages_view';
import * as Yup from 'yup';
import orphanages_view from '../views/orphanages_view';
import path from 'path';

async function deleteImages(id: Number, RequestImages:  Express.Multer.File[]) {
    const fs = require('fs')
           
    const imagesRepository = getRepository(ImageMod);

    // const images = await imagesRepository.find({
    //     where: { orphanage_id: Number(id) }
    //   }); 
    //     .andWhere("path NOT IN (:...paths)", { paths: RequestImages.map(image => image.filename.split("-")[1]) });

    let query = imagesRepository
    .createQueryBuilder('images')
    .where(`orphanage_id = ${ id }`);

    const images = await query.getMany();

    images.forEach(async (img : any) =>  {

        let arquivos = RequestImages.filter(image => image.filename.split("-")[1] === img.path.split("-")[1] );

        // console.log(arquivos);
        // console.log(arquivos.length);

        if(arquivos.length > 0 )
        {
            // console.log(img.path.split("-")[1]);

            let file = path.join(__dirname, '..', '..', 'uploads', img.path);

            fs.stat(file, function (err: any) {

                if (!err) {
                    fs.unlink(file, (err: any) => {
                        if (err) {
                        console.error(err)
                        return
                        }
                    })
                }
             });

            await imagesRepository.remove(img);
        }

        }
    )        
  }

export default class OrphanagesController  {

    async index(_: Request, response: Response) {

        const orphanagesRepository = getRepository(Orphanage);
        const orphanages = await orphanagesRepository.find({
            relations: ['images']
        });

        return response.json(OrphanageView.renderMany(orphanages));
    }

    async indexPending(req: Request, res: Response) {
        const { ok } = req.params;
        const orphanagesRespository = getRepository(Orphanage)

        let query = orphanagesRespository
                    .createQueryBuilder('orphanages')
                    .where(`permission = ${ ok }`);

        if(ok === "0") query=query.andWhere(`user_id IS NULL`);

        const orphanages = await query.getMany() as Orphanage[];

        return res.json(orphanages_view.renderMany(orphanages))
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
            instructions, opening_hours, open_on_weekends, permission } = request.body;
    
        const orphanagesRepository = getRepository(Orphanage); 

        const data = { name, latitude, longitude, about,
            instructions, opening_hours, 
            open_on_weekends: open_on_weekends === 'true', 
            whatsapp,
            permission
        };

        const schema = Yup.object().shape({
            name: Yup.string().required("Nome obrigatório"),
            latitude: Yup.number().required(),
            longitude: Yup.number().required(),
            about: Yup.string().required().max(300),
            instructions: Yup.string().required(),
            opening_hours: Yup.string().required(),
            open_on_weekends: Yup.boolean().required(),
            whatsapp: Yup.string().notRequired(),
            permission: Yup.boolean().required()
        });

        await schema.validate(data, { abortEarly: false });
        
        const orphanage = orphanagesRepository.create(data);

        await orphanagesRepository.save(orphanage);
        
        return response.status(201).json(orphanage);
    }


    async deleteimages (request: Request, response: Response) {

        const { id } = request.params;

        const { previewImages } = request.body;

        const fs = require('fs')
           
        const imagesRepository = getRepository(ImageMod);
    
        let splitpaths = previewImages.map( (img : any) => img.split("uploads/")[1])

        splitpaths = splitpaths.filter((item : any) => item !== undefined)

        let query = imagesRepository
        .createQueryBuilder('images')
        .where(`orphanage_id = ${ id }`);

        if(splitpaths.length > 0) 
        {
            query = query.andWhere("path NOT IN (:...paths)", { paths: splitpaths })
        }

        const imagesBD = await query.getMany();
         
        imagesBD.forEach(async (img : any) =>  {

            let file = path.join(__dirname, '..', '..', 'uploads', img.path);

            fs.stat(file, function (err: any) {

                if (!err) {
                    fs.unlink(file, (err: any) => {
                        if (err) {
                        console.error(err)
                        return
                        }
                    })
                }
                });

            await imagesRepository.remove(img);
        });

        return response.status(201).json(imagesBD);
    }


    async updateImage (request: Request, response: Response) {

        const { id } = request.params;
        const imagesRepository = getRepository(ImageMod);

        const RequestImages = request.files as Express.Multer.File[];

        RequestImages?.forEach(async image =>  {
            const data = { path: image.filename, orphanage_id: Number(id) };
            const imagedb = imagesRepository.create(data);
            await imagesRepository.save(imagedb);
        });

        return response.status(201).json(true);
    }

    async updateOrphanage(req: Request, res: Response) {
        const { id } = req.params
        const { user_id, name, latitude, longitude, about, instructions, whatsapp, 
                opening_hours, open_on_weekends, permission } = req.body

        const data = { user_id, name, latitude, longitude, about, instructions, whatsapp, 
                        opening_hours, open_on_weekends, permission }
        
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
        orphanage.whatsapp = whatsapp
        orphanage.instructions = instructions
        orphanage.opening_hours= opening_hours
        orphanage.open_on_weekends = open_on_weekends

        if(!orphanage.user_id)
        {
            if(permission)
            {
                orphanage.permission = true
                orphanage.user_id = Number(user_id)
            }
            else
            {
                orphanage.permission = false
                orphanage.user_id = Number(user_id)  
            }
        }

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

        deleteImages(Number(id), {} as Express.Multer.File[])

        return res.status(200).json({ message: "Orphanage successfully deleted!" })
    }
}












