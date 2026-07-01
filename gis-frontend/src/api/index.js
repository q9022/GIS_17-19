import request from '../utils/request'
import { DISTRICT_LIST, getStatsFileName, getBoundaryFileName } from '../config/districtMap'

export function getDistricts() {
  return request({
    url: '/api/districts',
    method: 'get'
  })
}

export async function getStats(districtId, year) {
  try {
    const response = await request({
      url: '/api/stats',
      method: 'get',
      params: { districtId, year }
    })
    return response
  } catch (error) {
    console.warn(`⚠️ API获取统计数据失败，使用本地文件: ${error.message}`)
    
    const fileName = getStatsFileName(districtId, year)
    const filePath = `${import.meta.env.BASE_URL}data/district_stats/stats_${year}/${fileName}`
    const localResponse = await fetch(filePath)
    if (!localResponse.ok) {
      throw new Error(`统计数据不存在: ${filePath}`)
    }
    return localResponse.json()
  }
}

export async function getDistrictBounds(districtId) {
  try {
    const response = await request({
      url: '/api/district/bounds',
      method: 'get',
      params: { id: districtId }
    })
    return response
  } catch (error) {
    console.warn(`⚠️ API获取边界数据失败，使用本地文件: ${error.message}`)
    
    const fileName = getBoundaryFileName(districtId)
    const filePath = districtId === 0
      ? `${import.meta.env.BASE_URL}data/boundary/${fileName}`
      : `${import.meta.env.BASE_URL}data/boundary/split_districts/${fileName}`
    const localResponse = await fetch(filePath)
    if (!localResponse.ok) {
      throw new Error(`边界数据不存在: ${filePath}`)
    }
    return localResponse.json()
  }
}

export async function queryPoint(lat, lng, year = 2021, districtId = 0) {
  try {
    const response = await request({
      url: '/api/point/query',
      method: 'get',
      params: { lat, lng, year, districtId }
    })
    return response
  } catch (error) {
    console.warn(`⚠️ API点查询失败，使用本地回退: ${error.message}`)
    return { pixel_value: 0, category: null }
  }
}