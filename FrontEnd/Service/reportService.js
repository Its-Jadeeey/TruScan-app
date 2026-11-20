import { client } from './analyzeService';
import { wasReported, rememberReport } from './scanCache';

export async function addReport({
  text, channel = 'sms', mode = 'normal', source = 'mobile_app',
  type = null, scamCategory = null, remark = '',
}) {
  try {
    if (wasReported(text)) return { success: false, duplicate: true };
    const res = await client.post('/report/', {
      text: (text || '').trim(),
      channel, mode, source, type, scamCategory,
      remark: (remark || '').trim().slice(0, 500),
    });
    if (res.data?.success) rememberReport(text);
    return { success: !!res.data?.success, id: res.data?.id };
  } catch (error) {
    console.error('[reportService] addReport error:', error.message);
    return {
      success: false,
      duplicate: error.response?.status === 409,
      rateLimited: error.response?.status === 429,
      error: error.response?.data?.detail || error.message,
    };
  }
}