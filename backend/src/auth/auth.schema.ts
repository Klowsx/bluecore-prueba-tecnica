export type Credentials = { email: string; password: string };

export const credentialsSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$',
      },
      password: { type: 'string', minLength: 5, maxLength: 128 },
    },
  },
};
