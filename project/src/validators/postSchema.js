const { z } = require('zod');

const createBookSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  author: z.string().min(1, 'Autor é obrigatório'),
  isbn: z.string().min(10, 'ISBN deve ter ao menos 10 caracteres'),
  description: z.string().optional(),
  published_year: z.preprocess((value) => value === undefined ? undefined : Number(value), z.number().int().positive().optional()),
  available: z.boolean().optional(),
});

const updateBookSchema = z
  .object({
    title: z.string().min(1).optional(),
    author: z.string().min(1).optional(),
    isbn: z.string().min(10).optional(),
    description: z.string().optional(),
    published_year: z.preprocess((value) => value === undefined ? undefined : Number(value), z.number().int().positive().optional()),
    available: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envie ao menos um campo para atualizar',
  });

const listBookSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  isbn: z.string().optional(),
  available: z.preprocess((value) => value === 'true' ? true : value === 'false' ? false : undefined, z.boolean().optional()),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.preprocess((value) => value === undefined ? undefined : Number(value), z.number().int().positive().optional()),
  limit: z.preprocess((value) => value === undefined ? undefined : Number(value), z.number().int().positive().optional()),
});

const createLoanSchema = z.object({
  book_id: z.preprocess((value) => Number(value), z.number().int().positive()),
  due_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Data inválida'),
});

const updateLoanSchema = z
  .object({
    return_date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Data inválida').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envie ao menos um campo para atualizar',
  });

const listLoanSchema = z.object({
  user_id: z.preprocess((value) => value === undefined ? undefined : Number(value), z.number().int().positive().optional()),
  book_id: z.preprocess((value) => value === undefined ? undefined : Number(value), z.number().int().positive().optional()),
  returned: z.preprocess((value) => value === 'true' ? true : value === 'false' ? false : undefined, z.boolean().optional()),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.preprocess((value) => value === undefined ? undefined : Number(value), z.number().int().positive().optional()),
  limit: z.preprocess((value) => value === undefined ? undefined : Number(value), z.number().int().positive().optional()),
});

module.exports = {
  createBookSchema,
  updateBookSchema,
  listBookSchema,
  createLoanSchema,
  updateLoanSchema,
  listLoanSchema,
};
