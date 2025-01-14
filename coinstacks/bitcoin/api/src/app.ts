import express, { json, urlencoded } from 'express'
import cors from 'cors'
import { join } from 'path'
import { Server } from 'ws'
import swaggerUi from 'swagger-ui-express'
import { Logger } from '@shapeshiftoss/logger'
import { middleware, ConnectionHandler } from '@shapeshiftoss/common-api'
import { RegisterRoutes } from './routes'

const port = process.env.PORT ?? 3000

const logger = new Logger({
  namespace: ['unchained', 'coinstacks', 'bitcoin', 'api'],
  level: process.env.LOG_LEVEL,
})

const app = express()

app.use(json())
app.use(urlencoded({ extended: true }))
app.use(cors())

app.get('/health', async (_, res) => res.json({ status: 'up', network: 'bitcoin' }))

const options = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ShapeShift Bitcoin API Docs',
  customfavIcon: '/public/favi-blue.png',
  swaggerUrl: '/swagger.json',
}

app.use('/public', express.static(join(__dirname, '../../../../../../common/api/public')))
app.use('/swagger.json', express.static(join(__dirname, './swagger.json')))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(undefined, options))

RegisterRoutes(app)

// redirect any unmatched routes to docs
app.get('/', async (_, res) => {
  res.redirect('/docs')
})

app.use(middleware.errorHandler)
app.use(middleware.notFoundHandler)

const server = app.listen(port, () => logger.info('Server started'))

const wsServer = new Server({ server })

wsServer.on('connection', (connection) => ConnectionHandler.start(connection))
