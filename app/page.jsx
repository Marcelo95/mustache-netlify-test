"use client";
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

// Função utilitária para montar campos EMV
function emv(id, value) {
    const length = String(value.length).padStart(2, '0');
    return `${id}${length}${value}`;
}

// CRC16-CCITT-FALSE
function crc16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Geração do payload Pix conforme BACEN (ajustes para garantir compatibilidade)
function gerarPayloadPix({ chave, valor, nome, cidade }) {
    function removeAccents(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }
    nome = removeAccents(nome).toUpperCase().substring(0, 25);
    cidade = removeAccents(cidade).toUpperCase().substring(0, 15);

    // Merchant Account Information (Pix) - ID 26
    const gui = emv("00", "BR.GOV.BCB.PIX");
    const chaveField = emv("01", chave);
    const merchantAccountInfo = emv("26", gui + chaveField);

    // Additional Data Field Template (ID 62) - Txid obrigatório (mesmo que seja "***")
    const additional = emv("05", "***");
    const additionalField = emv("62", additional);

    // Montagem do payload conforme padrão EMV do BACEN
    const payload =
        emv("00", "01") + // Payload Format Indicator
        merchantAccountInfo +
        emv("52", "0000") + // Merchant Category Code
        emv("53", "986") + // Transaction Currency (BRL)
        emv("54", valor.toFixed(2)) + // Transaction Amount (sempre com 2 casas decimais)
        emv("58", "BR") + // Country Code
        emv("59", nome) + // Merchant Name
        emv("60", cidade) + // Merchant City
        additionalField;

    // Adiciona campo do CRC16
    const payloadComCRC = payload + "6304";
    const crc = crc16(payloadComCRC);
    return payloadComCRC + crc;
}

export default function Page() {
    const chavePix = "marcelovieira1995@gmail.com";
    const valor = 12.38;
    const nome = "Nome do Recebedor";
    const cidade = "SAO PAULO";

    const payloadPix = gerarPayloadPix({
        chave: chavePix,
        valor,
        nome,
        cidade,
    });

    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(payloadPix);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div>
            <h2>QR Code do Pix ({valor})</h2>
            <br /><br />
            <QRCodeSVG
                value={payloadPix}
                size={360}
                includeMargin={true}
                bgColor="#FFFFFF"
                fgColor="#000000"
                level="M"
            />
            <br /><br />
            <div style={{ marginTop: 12 }}>
                <button onClick={handleCopy}>
                    {copied ? "Chave Pix copiada!" : "Copiar chave Pix"}
                </button>
            </div>
        </div>
    );
}
