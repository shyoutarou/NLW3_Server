import { Request, Response } from "express"
import { getRepository } from "typeorm"
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import * as Yup from 'yup'
import User from "../models/User"
import jwt from 'jsonwebtoken'
import users_view from "../views/users_view"
import { MailtrapMailProvider } from "../providers/implementations/MailtrapMailProvider"

function generateToken(params: any) {
    return jwt.sign(params, String(process.env.SECRET_KEY), {
      expiresIn: '20m',
    })
  }

export default class UsersController  {
    async create(req: Request, res: Response) {

        try {
            const { name, email, password: uncryptedPass } = req.body
            const userRepository = getRepository(User)

            const schema = Yup.object().shape({
                name: Yup.string().max(15, 'Seu nome deve ter no máximo 15 caracteres.')
                    .min(2, 'Seu nome deve ter no mínimo 2 caracteres.').required('O nome é obrigatório!'),                
                email: Yup.string().email('Email inválido!').required('O email é obrigatório!'),
                uncryptedPass: Yup.string().required('A senha é obrigatória!')
            })
            
            await schema.validate({ name, email, uncryptedPass }, { abortEarly: false })

            const emailExists = await userRepository.findOne({ where: { email } })
    
            if (emailExists) return res.status(400)
            .json({ success: false, message: 'Email já cadastrado' });
            
            const user = new User()
            user.name = name
            user.email = email

            const salt =  await bcrypt.genSalt(10);
            const password = await bcrypt.hash(uncryptedPass, salt)
            user.password = password

            await userRepository.save(user)
            
            return res.status(200).json(users_view.render(user))
        }
        catch (err) {
            return res.status(400).json({
                message: err.message || "Erro inesperado ao criar user" //400 Bad Request
            })
        }        
    }

    async listUsers(request: Request, response: Response) {
        try {

            const userRepository = getRepository(User)

            const users = await userRepository.find({
                relations: ['orphanages']
            })
    
            if(users.length === 0) {
                return response.json([])
            }  

            return response.json(users_view.renderMany(users));
        }
        catch (err) {
            return response.status(400).json({
                message: err.message || "Erro inesperado ao listar usuários" //400 Bad Request
            })
        }                      
    }

    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body
            const data = { email, password }

            const schema = Yup.object().shape({
                email: Yup.string().email('Email inválido!').required('O email é obrigatório!'),
                password: Yup.string().required('Senha é obrigatória!')
            })

            await schema.validate(data)

            const userRepository = getRepository(User)
            const user = await userRepository.findOne({ where: { email } })

            if(!user) {
                return res.status(404).json({ message: 'Usuário não cadastrado!' })
            }

            if(!await bcrypt.compare(password, user.password)) {
                return res.status(401).json({ message: 'Usuário ou senha incorretos!' })
            }

            const token = generateToken({ id: user.id })
            return res.status(200).json({ user: users_view.render(user), token })
        }
            catch (err) {
            return res.status(400).json({
                message: err.message || 'Erro inesperado no Login.' //400 Bad Request
            })
        }        
    }


    async verifyToken(req: Request, res: Response) {

        const userRepository = getRepository(User)

        const user = await userRepository.findOne(req.body.userId)

        if(!user) {
            return res.status(500).json({ message: "unknown user" })
        }

        return res.status(200).json(users_view.render(user))

    }

    async forgotPassword(request: Request, response: Response) {

        const { email } = request.body
    
        try {
    
            const userRepository = getRepository(User)

            const user = await userRepository.findOne({
                where: { email }
            })
    
            if(!user) {
                return response.status(404).send('Usuário não cadastrado') //404 Not Found
            }
    
            const password_token = crypto.randomBytes(16).toString('hex')
            const token_expires = new Date()
            token_expires.setMinutes(token_expires.getMinutes() + 60)
    
     
            const updateuser = { password_token, token_expires };

            userRepository.save({
                ...user, // existing fields
                ...updateuser // updated fields
            });

            const mailProvider = new MailtrapMailProvider()
    
            const body = `<div style="background-color: #8257E5; width: 500px; height: 400px;">
                          <h1 style="color: white; font-size: 28px; text-align: center; padding: 40px;">Redefinição
                          de senha - Proffy</h1>
                          <h1 style="color: white; font-size: 20px; text-align: justify; padding: 0 24px;">Olá, ${user.name}!
                          Foi solicitada a redefinição da sua senha na nossa plataforma! Para prosseguir, clique no
                          botão abaixo e preencha os campos para completar o processo!</h1>
                          <a style="text-decoration: none;" href="${String(process.env.APP_WEB_URL)}/reset-password/${user.id}/${password_token}">
                              <div style="text-decoration: none; cursor: pointer; width: 197px; height: 56px; background-color: #04BF58; border-radius: 8px; margin: 0 auto;">
                                  <p style="color: white; text-align: center; line-height: 56px;">Redefinir senha</p>
                              </div>
                          </a>
                          </div>`
            
              await mailProvider.sendMail({
                to: {
                  name: user.name,
                  email: email
                },      
                from: {
                  name: 'Equipe do meu app',
                  email: 'equipe@meuapp.com'
                },          
                subject: "Redefinição de Senha - Proffy", // Subject line
                text: "Foi solicitada a redefinição da sua senha na nossa plataforma! Para prosseguir, entre no link a seguir e preencha os campos: ", // plain text body
                body,
            })
            
            return response.status(200).send('Email enviado a sua conta') //200 OK
        }
        catch (err) {
            return response.status(400).json({
                message: err.message || 'Erro inesperado ao reiniciar password.' //400 Bad Request
            })
        }
    }
    
    async gerartokenTestes(request: Request, response: Response) {
        const { email } = request.body

        const userRepository = getRepository(User)

        const user = await userRepository.findOne({
            where: { email }
        })

        if(!user) {
            return response.status(404).send('Usuário não cadastrado') //404 Not Found
        }

        const token_expires = new Date()
        token_expires.setSeconds(token_expires.getSeconds() + 5)
        // token_expires.setHours(token_expires.getHours() + 48)

        const password_token = generateToken({ id: user.id })
        
        // const password_token = crypto.randomBytes(16).toString('hex')

        const updateuser = { password_token, token_expires };

        userRepository.save({
            ...user, // existing fields
            ...updateuser // updated fields
        });

        return response.status(201).send('gerado token: ' + password_token + ' para:' + token_expires) //201 Created
    }
    
    async resetPassword(request: Request, response: Response) {
        const { password, token } = request.body
        const { id } = request.params

        const userRepository = getRepository(User)

        const user = await userRepository.findOne({
            where: { id }
        })

        if(!user) {
        return response.status(404).send('Usuário não cadastrado') //404 Not Found
        }

        if(user.password_token !== token) {
            return response.status(401).send('Token inválido') //401 Unauthorized
        }

        if(user.token_expires.getMilliseconds() < Date.now()) {
            return response.status(401).send('Token vencido') //401 Unauthorized
        }

        const hashpassword = await bcrypt.hash(password, 10)

        const updateuser = { password: hashpassword, password_token: undefined, token_expires: undefined };

        userRepository.save({
            ...user, // existing fields
            ...updateuser // updated fields
        });
        
        return response.status(200).send('Password alterado com sucesso') //200 OK
    }       
}