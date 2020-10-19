import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export default (request: Request, response: Response, next: NextFunction) => {
    
    if(!request.headers.authorization) {
        return response.status(401).send('Sem token!') //401 Unauthorized
    }

    const token = request.headers.authorization.split(' ');

    if(token[0] !== 'Bearer') {
        return response.status(401).send(token[0] + 'Formato de token invalido!') //401 Unauthorized
    }

    jwt.verify(token[1], String(process.env.SECRET_KEY), (err, decoded) => {

        if(err) {
          return response.status(401).json({
              message: err.message || "Token invalido" //401 Unauthorized
          })          
        }
        request.body.userId = decoded as any
        next()
  })
}
