const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres'),
});

const updateSchema = z
  .object({
    name: z.string().min(3).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Envie ao menos um campo para atualizar',
  });

const listSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  role: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z.preprocess((value) => value === undefined ? undefined : Number(value), z.number().int().positive().optional()),
  limit: z.preprocess((value) => value === undefined ? undefined : Number(value), z.number().int().positive().optional()),
});

const idParamSchema = z.object({
  id: z.preprocess((value) => Number(value), z.number().int().positive()),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateSchema,
  listSchema,
  idParamSchema,
};
