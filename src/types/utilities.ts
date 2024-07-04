export type ValueOf<T> = T[keyof T];
export type PropName<T> = keyof T;
export type Unarray<T> = T extends Array<infer U> ? U : T;
export type Modify<T, R extends Partial<T>> = Omit<T, keyof R> & R;
