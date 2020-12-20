
export default class Message {
    text: string | null
    fromId: string
    fromName: string | null
    date: Date | string
    service?: number

    constructor(
    text: string | null,
    fromId: string,
    fromName: string | null,
    service?: number
) {
    this.text = text;
    this.fromId = fromId;
    this.fromName = fromName;
    this.service = service;
    this.date = new Date();
}
}