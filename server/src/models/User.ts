import { BeforeInsert, Column, Entity, 
         JoinColumn, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import bcrypt from 'bcrypt'
import Orphanage from './Orphanage'

@Entity('users')
class User {
    @PrimaryGeneratedColumn()
    id: number
    @Column()
    name: string
    @Column()
    email: string
    @Column()
    password: string
    @Column()
    password_token: string
    @Column()
    token_expires: Date
    @OneToMany(type => Orphanage, orphanage => orphanage.user)
    @JoinColumn({ name: 'user_id' })
    orphanages: Orphanage[]
    @BeforeInsert()
    async beforeInsert() {
        const salt =  await bcrypt.genSalt(10);
        this.password =await bcrypt.hash(this.password, salt);
        console.log("this.password:" + this.password)
    }
}

export default User