import Chat from './chat'

let chats: Chat[] = [ new Chat('main') ];

export const getChat = (_id: string): Chat | undefined => {
    return chats.find(({id}) => id === _id);
}

export const addChat = (chat: Chat) => {
    chats.push(chat);
}

export const deleteChat = (_id: string) => {
    chats = chats.filter((chat) => {
        const match = chat.id === _id && chat.name !== 'main';

        if(match) chat._closeChat();

        return !match;
    });
}

export const getAllChats = () => chats;