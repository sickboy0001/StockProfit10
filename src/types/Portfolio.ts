// src/types/Portfolio.ts
export type Portfolio = {
  id: string; // DBからは数値で返るが、クライアントでは文字列で扱うことが多い
  user_id: string;
  name: string; //
  memo: string; //
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  displayOrder: number;
  stocks: { code: string; name: string }[];
};
