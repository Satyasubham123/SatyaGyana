import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-bg-deep pt-24 px-4 pb-24">
      <div className="max-w-4xl mx-auto">
        
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-brand transition-colors mb-8 font-bold uppercase tracking-widest text-[10px]">
          <ArrowLeft className="h-4 w-4" /> Back to Home
        </Link>

        {/* Content Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-8 sm:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-8 border-b border-slate-800 pb-8">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter text-white">Refund Policy</h1>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">Last Updated: May 2026</p>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-slate-300 space-y-6 text-sm sm:text-base leading-relaxed">
            <p>
              Thank you for subscribing to GyanMitra. We want to ensure you have a clear understanding of our billing terms before purchasing our educational tools.
            </p>

            <h3 className="text-xl font-black uppercase text-white mt-8 mb-4">1. Strict No-Refund Policy</h3>
            <p>
              All sales are final. Because GyanMitra provides immediate access to digital educational resources, interactive AI study tools, and proprietary curriculum data, <strong>we do not offer refunds, exchanges, or credits for any purchases or subscriptions under any circumstances.</strong>
            </p>

            <h3 className="text-xl font-black uppercase text-white mt-8 mb-4">2. Subscription Cancellations</h3>
            <p>
              You may cancel your ongoing subscription at any time to prevent future billing. If you choose to cancel, you will not be billed for any subsequent terms, and your account access will remain active until the end of your current paid billing period. However, cancelling does not entitle you to a partial or full refund for the time remaining in your billing cycle.
            </p>

            <h3 className="text-xl font-black uppercase text-white mt-8 mb-4">3. Exceptional Circumstances</h3>
            <p>
              Exceptions to this policy are strictly limited to verified billing errors made by our payment processor (e.g., accidental duplicate charges for the same transaction). In such rare cases, please contact our support team immediately.
            </p>

            <h3 className="text-xl font-black uppercase text-white mt-8 mb-4">4. Contact Support</h3>
            <p>
              If you have any questions regarding your billing, account, or need assistance cancelling your subscription, please email our support team at <a href="mailto:support@gyanmitra.com" className="text-brand hover:underline font-bold">support@gyanmitra.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}