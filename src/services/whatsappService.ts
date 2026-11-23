import { SchoolConfig } from '../types';

export interface WhatsAppSendResult {
  recipientName: string;
  phone: string;
  status: 'success' | 'failed' | 'fallback_link';
  message: string;
  waLink?: string;
}

// Format Indonesian phone number to international 628xxx format
export function formatPhoneNumber(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean;
  }
  return clean;
}

// Format template with employee variables
export function formatWhatsAppMessage(
  template: string,
  variables: {
    nama: string;
    nip: string;
    sekolah: string;
    jam_batas: string;
    tanggal?: string;
  }
): string {
  let text = template;
  text = text.replace(/{nama}/g, variables.nama);
  text = text.replace(/{nip}/g, variables.nip);
  text = text.replace(/{sekolah}/g, variables.sekolah);
  text = text.replace(/{jam_batas}/g, variables.jam_batas);
  if (variables.tanggal) {
    text = text.replace(/{tanggal}/g, variables.tanggal);
  }
  return text;
}

// Generate direct WhatsApp click-to-chat URL
export function generateWhatsAppLink(phone: string, text: string): string {
  const formattedPhone = formatPhoneNumber(phone);
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

// Send message via configured Gateway API (e.g. Fonnte or Wablas or custom gateway)
export async function sendWhatsAppMessageViaGateway(
  config: SchoolConfig,
  targetPhone: string,
  messageText: string,
  recipientName: string
): Promise<WhatsAppSendResult> {
  const formattedPhone = formatPhoneNumber(targetPhone);
  const waLink = generateWhatsAppLink(targetPhone, messageText);

  // If gateway URL or API key is not configured or is default dummy, return fallback link
  if (
    !config.whatsappApiUrl ||
    !config.whatsappApiKey ||
    config.whatsappApiKey.includes('TOKEN_GATEWAY_SDIT')
  ) {
    return {
      recipientName,
      phone: targetPhone,
      status: 'fallback_link',
      message: 'Gateway token belum dikonfigurasi. Menggunakan tautan WhatsApp langsung.',
      waLink,
    };
  }

  try {
    // Attempt standard Fonnte / Wablas style POST request
    const response = await fetch(config.whatsappApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: config.whatsappApiKey,
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: messageText,
        countryCode: '62',
      }),
    });

    if (response.ok) {
      const resJson = await response.json().catch(() => ({}));
      return {
        recipientName,
        phone: targetPhone,
        status: 'success',
        message: 'Pesan berhasil terkirim melalui WhatsApp Gateway API.',
        waLink,
      };
    } else {
      return {
        recipientName,
        phone: targetPhone,
        status: 'failed',
        message: `Gateway API mengembalikan status ${response.status}`,
        waLink,
      };
    }
  } catch (error) {
    return {
      recipientName,
      phone: targetPhone,
      status: 'fallback_link',
      message: `Gagal memanggil Gateway (${error instanceof Error ? error.message : 'Koneksi terbatas'}). Gunakan tautan WhatsApp langsung.`,
      waLink,
    };
  }
}
