interface IAddress {
    email: string
    name: string
}

export interface IMessage {
    to: IAddress
    from: IAddress
    subject: string
    text: string
    body: string
}

export interface IMailProvider {

    // Métodos assíncronos retornam Promise
    sendMail (message: IMessage): Promise<void>
}