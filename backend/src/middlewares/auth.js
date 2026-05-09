// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken')

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      throw new Error()
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Veuillez vous authentifier',
      code: 'UNAUTHORIZED'
    })
  }
}

module.exports = auth