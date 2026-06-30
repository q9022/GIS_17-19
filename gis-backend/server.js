const express = require('express')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = 8080

app.use(cors())
app.use(express.json())

const FRONTEND_DATA_PATH = path.join(__dirname, '..', 'gis-frontend', 'public', 'data')

const DISTRICT_MAP = {
  0: '全市',
  1: '芙蓉区',
  2: '天心区',
  3: '岳麓区',
  4: '开福区',
  5: '雨花区',
  6: '望城区',
  7: '长沙县',
  8: '浏阳市',
  9: '宁乡市'
}

const DISTRICT_ENGLISH = {
  0: 'changsha_city',
  1: 'furong',
  2: 'tianxin',
  3: 'yuelu',
  4: 'kaifu',
  5: 'yuhua',
  6: 'wangcheng',
  7: 'changsha_county',
  8: 'liuyang',
  9: 'ningxiang'
}

function getStatsFileName(districtId, year) {
  if (districtId === 0) {
    return `Changsha_Districts_ESA_WC10m_${year}_final.json`
  }
  const englishNames = {
    1: 'Furong',
    2: 'Tianxin',
    3: 'Yuelu',
    4: 'Kaifu',
    5: 'Yuhua',
    6: 'Wangcheng',
    7: 'ChangshaCounty',
    8: 'Liuyang',
    9: 'Ningxiang'
  }
  const prefix = String(districtId).padStart(2, '0')
  return `${prefix}_${englishNames[districtId]}_ESA_WC10m_${year}_final.json`
}

function getCOGFileName(districtId, year) {
  if (districtId === 0) {
    return `Changsha_Districts_ESA_WC10m_${year}_final.tif`
  }
  const englishNames = {
    1: 'Furong',
    2: 'Tianxin',
    3: 'Yuelu',
    4: 'Kaifu',
    5: 'Yuhua',
    6: 'Wangcheng',
    7: 'ChangshaCounty',
    8: 'Liuyang',
    9: 'Ningxiang'
  }
  const prefix = String(districtId).padStart(2, '0')
  return `${prefix}_${englishNames[districtId]}_ESA_WC10m_${year}_final.tif`
}

function getBoundaryFileName(districtId) {
  if (districtId === 0) {
    return 'changsha_districts.geojson'
  }
  const prefix = String(districtId).padStart(2, '0')
  const englishNames = {
    1: 'furong',
    2: 'tianxin',
    3: 'yuelu',
    4: 'kaifu',
    5: 'yuhua',
    6: 'wangcheng',
    7: 'changsha_county',
    8: 'liuyang',
    9: 'ningxiang'
  }
  return `${prefix}_${englishNames[districtId]}.geojson`
}

app.get('/districts', (req, res) => {
  console.log('🔌 API调用: GET /districts')
  const districts = Object.entries(DISTRICT_MAP).map(([id, name]) => ({
    id: parseInt(id),
    name,
    english_name: DISTRICT_ENGLISH[id]
  }))
  res.json({ code: 200, message: 'success', data: districts })
})

app.get('/stats', (req, res) => {
  const { districtId, year } = req.query
  const dId = parseInt(districtId) || 0
  const y = parseInt(year) || 2021
  
  console.log(`🔌 API调用: GET /stats?districtId=${dId}&year=${y}`)
  
  try {
    const fs = require('fs')
    const fileName = getStatsFileName(dId, y)
    const filePath = path.join(FRONTEND_DATA_PATH, 'district_stats', `stats_${y}`, fileName)
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ 统计文件不存在: ${filePath}`)
      return res.status(404).json({ code: 404, message: '统计数据不存在' })
    }
    
    const data = fs.readFileSync(filePath, 'utf-8')
    const jsonData = JSON.parse(data)
    
    res.json({ code: 200, message: 'success', data: jsonData })
  } catch (error) {
    console.error('❌ 读取统计数据失败:', error)
    res.status(500).json({ code: 500, message: '读取统计数据失败' })
  }
})

app.get('/district/bounds', (req, res) => {
  const { id } = req.query
  const districtId = parseInt(id) || 0
  
  console.log(`🔌 API调用: GET /district/bounds?id=${districtId}`)
  
  try {
    const fs = require('fs')
    const fileName = getBoundaryFileName(districtId)
    const filePath = districtId === 0
      ? path.join(FRONTEND_DATA_PATH, 'boundary', fileName)
      : path.join(FRONTEND_DATA_PATH, 'boundary', 'split_districts', fileName)
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ 边界文件不存在: ${filePath}`)
      return res.status(404).json({ code: 404, message: '边界数据不存在' })
    }
    
    const data = fs.readFileSync(filePath, 'utf-8')
    const geojson = JSON.parse(data)
    
    res.json({ code: 200, message: 'success', data: geojson })
  } catch (error) {
    console.error('❌ 读取边界数据失败:', error)
    res.status(500).json({ code: 500, message: '读取边界数据失败' })
  }
})

const COLOR_MAP = {
  10: { name: '林地', color: '#006400' },
  20: { name: '灌木地', color: '#228B22' },
  30: { name: '草地', color: '#7CFC00' },
  40: { name: '耕地', color: '#FFD700' },
  50: { name: '建成区', color: '#FF0000' },
  60: { name: '裸地/稀疏植被', color: '#D2691E' },
  80: { name: '永久水体', color: '#0064C8' },
  90: { name: '草本湿地', color: '#00CED1' }
}

module.exports = { COLOR_MAP }

app.get('/point/query', async (req, res) => {
  const { lat, lng, year, districtId } = req.query
  const latitude = parseFloat(lat)
  const longitude = parseFloat(lng)
  const queryYear = parseInt(year) || 2021
  const queryDistrictId = parseInt(districtId) || 0
  
  console.log(`🔌 API调用: GET /point/query?lat=${latitude}&lng=${longitude}&year=${queryYear}&districtId=${queryDistrictId}`)
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ code: 400, message: '坐标参数无效' })
  }
  
  const CHANGSHA_BOUNDS = {
    minLat: 27.8,
    maxLat: 28.5,
    minLng: 112.6,
    maxLng: 113.4
  }
  
  if (latitude < CHANGSHA_BOUNDS.minLat || latitude > CHANGSHA_BOUNDS.maxLat ||
      longitude < CHANGSHA_BOUNDS.minLng || longitude > CHANGSHA_BOUNDS.maxLng) {
    console.log('📍 坐标不在长沙市范围内')
    return res.json({ code: 200, message: 'success', data: { pixel_value: 0 } })
  }
  
  try {
    const fs = require('fs')
    const geotiff = require('geotiff')
    
    const cogFileName = getCOGFileName(queryDistrictId, queryYear)
    const COG_PATH = path.join(FRONTEND_DATA_PATH, 'district_cogs', `${queryYear}_cog`, cogFileName)
    
    console.log(`📁 COG文件路径: ${COG_PATH}`)
    
    if (!fs.existsSync(COG_PATH)) {
      console.log(`⚠️ COG文件不存在: ${COG_PATH}`)
      
      if (queryDistrictId !== 0) {
        console.log('📍 尝试回退到全市COG文件')
        const cityCogFileName = getCOGFileName(0, queryYear)
        const cityCOG_PATH = path.join(FRONTEND_DATA_PATH, 'district_cogs', `${queryYear}_cog`, cityCogFileName)
        
        if (fs.existsSync(cityCOG_PATH)) {
          return processCOGQuery(cityCOG_PATH, latitude, longitude, res)
        }
      }
      
      return res.status(404).json({ code: 404, message: 'COG文件不存在' })
    }
    
    return processCOGQuery(COG_PATH, latitude, longitude, res)
    
  } catch (error) {
    console.error('❌ 点查询失败:', error)
    return res.status(500).json({ code: 500, message: '点查询失败: ' + error.message })
  }
})

async function processCOGQuery(COG_PATH, latitude, longitude, res) {
  try {
    const geotiff = require('geotiff')
    const tiff = await geotiff.fromFile(COG_PATH)
    const image = await tiff.getImage()
    
    const fileDirectory = image.fileDirectory
    const tiepoint = fileDirectory.ModelTiepoint
    const pixelScale = fileDirectory.ModelPixelScale
    
    if (!tiepoint || !pixelScale) {
      console.error('❌ COG文件缺少必要的地理参考信息')
      return res.status(500).json({ code: 500, message: 'COG文件缺少必要的地理参考信息' })
    }
    
    const geoOriginX = Number(tiepoint[3])
    const geoOriginY = Number(tiepoint[4])
    const geoPixelWidth = Number(pixelScale[0])
    const geoPixelHeight = Number(pixelScale[1])
    
    console.log(`📊 COG地理参考: 原点(${geoOriginX}, ${geoOriginY}), 像素大小(${geoPixelWidth}, ${geoPixelHeight})`)
    
    const col = Math.floor((longitude - geoOriginX) / geoPixelWidth)
    const row = Math.floor((geoOriginY - latitude) / geoPixelHeight)
    
    const imageWidth = Math.round(Number(fileDirectory.ImageWidth))
    const imageHeight = Math.round(Number(fileDirectory.ImageLength))
    
    console.log(`📊 像素坐标: col=${col}, row=${row}, 图像尺寸: ${imageWidth}x${imageHeight}`)
    
    if (col < 0 || col >= imageWidth || row < 0 || row >= imageHeight) {
      console.log('📍 像素坐标超出图像范围')
      return res.json({ code: 200, message: 'success', data: { pixel_value: 0 } })
    }
    
    const data = await image.readRasters()
    const pixelValues = data[0]
    const pixelIndex = row * imageWidth + col
    const pixelValue = Math.round(pixelValues[pixelIndex])
    
    console.log(`✅ 查询成功: 像素值=${pixelValue}, 类别=${COLOR_MAP[pixelValue] ? COLOR_MAP[pixelValue].name : '未知'}`)
    
    res.json({ 
      code: 200, 
      message: 'success', 
      data: { 
        pixel_value: pixelValue,
        category: COLOR_MAP[pixelValue]
      } 
    })
    
  } catch (error) {
    console.error('❌ 处理COG查询失败:', error)
    return res.status(500).json({ code: 500, message: '处理COG查询失败: ' + error.message })
  }
}

app.listen(PORT, () => {
  console.log(`🚀 GIS Backend Server running on http://localhost:${PORT}`)
  console.log(`📁 数据目录: ${FRONTEND_DATA_PATH}`)
})
