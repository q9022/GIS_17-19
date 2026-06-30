import request from '../utils/request'

export function getDistricts() {
  return request({
    url: '/districts',
    method: 'get'
  })
}

export function getStats(districtId, year) {
  return request({
    url: '/stats',
    method: 'get',
    params: { districtId, year }
  })
}

export function getDistrictBounds(districtId) {
  return request({
    url: '/district/bounds',
    method: 'get',
    params: { id: districtId }
  })
}

export function queryPoint(lat, lng, year = 2021, districtId = 0) {
  return request({
    url: '/point/query',
    method: 'get',
    params: { lat, lng, year, districtId }
  })
}