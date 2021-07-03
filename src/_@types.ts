export type Index = {
  x: number;
  y: number;
};


export type Grid = Array<Array<Players | null>>;


export enum Players {
  ONE = 'red',
  TWO = 'blue',
}