'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const COINS = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    address: 'bc1qct0yly9yc2gj4s76y0ey5sqvugh4kt3g6n43fs',
    color: '#c87533',
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    address: '0x3a42E3c805f1F2856fd86cFF28d5f9053bbe47D0',
    color: '#5a72c7',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    address: '284EBCMF3yDQvsoQ4if6UQnEXFN2np5JekCNmr2sZQ1N',
    color: '#7c5cbf',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin (ETH)',
    address: '0x3a42E3c805f1F2856fd86cFF28d5f9053bbe47D0',
    color: '#2775ca',
  },
];

function CoinCard({ symbol, name, address, color }) {
  const [copied, setCopied] = useState(false);
  const short = address.slice(0, 6) + '…' + address.slice(-4);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-xl" style={{background:'#faf9f6', border:'1px solid #e5e0d8'}}>
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-xs font-extrabold tracking-wider" style={{color}}>{symbol}</span>
        <span className="text-[10px]" style={{color:'#9ca3af'}}>{name}</span>
      </div>
      <div className="p-1.5 rounded-lg" style={{background:'#ffffff', border:'1px solid #e5e0d8'}}>
        <QRCodeSVG value={address} size={76} level="M" bgColor="#ffffff" fgColor="#2d3436" />
      </div>
      <span className="text-[10px] font-mono" style={{color:'#636e72'}}>{short}</span>
      <button
        onClick={copy}
        className="text-[10px] px-2.5 py-1 rounded-md font-bold w-full"
        style={{
          background: copied ? '#f0faf5' : '#ffffff',
          border: `1px solid ${copied ? '#22c55e44' : '#e5e0d8'}`,
          color: copied ? '#15803d' : '#9ca3af',
          transition: 'all 0.2s',
        }}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function CryptoDonate() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl mb-5" style={{background:'#ffffff', border:'1px solid #e5e0d8', boxShadow:'0 2px 16px rgba(0,0,0,0.05)'}}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm font-bold" style={{color:'#2d3436'}}>Bankless donations</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-wide"
            style={{background:'#f0faf5', color:'#2d8653', border:'1px solid #d1ead9'}}>
            BTC · ETH · SOL · USDC
          </span>
        </div>
        <span className="text-base font-light" style={{color:'#b0b8b4'}}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="px-5 pb-5">
          <p className="text-xs mb-4 text-center" style={{color:'#636e72'}}>
            Support the mission — permissionless donations
          </p>
          <div className="grid grid-cols-2 gap-3">
            {COINS.map(c => <CoinCard key={c.symbol} {...c} />)}
          </div>
          <p className="text-[10px] mt-4 text-center leading-relaxed" style={{color:'#9ca3af'}}>
            All donations support One Love Outdoors Inc, a 501(c)(3). EIN 33-1310202
          </p>
        </div>
      )}
    </div>
  );
}
