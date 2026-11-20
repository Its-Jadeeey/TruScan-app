import { client } from './analyzeService';

export async function addReport({
  text, channel = 'sms', mode = 'normal', source = 'mobile_app',
  type = null, scamCategory = null, remark = '',
}) {
  try {
    const res = await client.post('/report/', {
      text: (text || '').trim(),
      channel, mode, source, type, scamCategory,
      remark: (remark || '').trim().slice(0, 500),
    });
    return { success: !!res.data?.success, id: res.data?.id };
  } catch (error) {
    console.error('[reportService] addReport error:', error.message);
    return {
      success: false,
      rateLimited: error.response?.status === 429,
      error: error.response?.data?.detail || error.message,
    };
  }
}