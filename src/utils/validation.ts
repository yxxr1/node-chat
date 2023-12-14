export const validateName = (name?: string | null) => name && /^[a-zA-Zа-яА-Я0-9]{3,12}$/.test(name);
