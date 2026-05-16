import { Card } from '@/components/ui/Card'
import { FAQS } from '@/lib/constants'

export const FaqSection = () => {
  return (
    <div className="space-y-4">
      {FAQS.map((faq, i) => (
        <Card key={i} className="p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-2">{faq.q}</h3>
          <p className="text-slate-600 leading-relaxed">{faq.a}</p>
        </Card>
      ))}
      
      <div className="bg-green-50 rounded-2xl p-8 text-center mt-8 border border-green-100">
        <h2 className="text-xl font-bold text-green-900">Still have questions?</h2>
        <p className="text-green-700 mt-2 mb-6">We're here to help you manage your ajo groups efficiently.</p>
        <a 
          href="https://wa.me/2349065543761" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center px-8 py-3 rounded-xl shadow-lg shadow-green-200 text-white bg-green-600 hover:bg-green-700 font-bold transition-all"
        >
          Contact Support on WhatsApp
        </a>
      </div>
    </div>
  )
}
