const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

module.exports = (app) => {
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Website Analytics API',
        version: '1.0.0',
      },
      components: {
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'x-api-key'
          }
        }
      },
    },
    apis: ['./src/routes/*.js'],
  };

  const swaggerSpec = swaggerJSDoc(options);

  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: { persistAuthorization: true }
  }));

  app.get('/api/docs-json', (req, res) => res.json(swaggerSpec));

  console.log("✔️ Swagger running at http://localhost:3000/api/docs");
};
