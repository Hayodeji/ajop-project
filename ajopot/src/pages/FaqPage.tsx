import { Card } from '@/components/ui/Card'

const FAQS = [
  {
    q: 'How does the free trial work?',
    a: 'Every new admin starts with a 7-day free trial of the Smart plan. You can explore all features, add members, and manage groups. On day 7, your card will be automatically charged for the plan you selected during signup.',
  },
  {
    q: 'What happens if a member is late?',
    a: 'AjoPot marks contributions as late automatically if they are not paid by the due date. For Smart and Pro plans, we send automated WhatsApp reminders to late members.',
  },
  {
    q: 'Can I change my plan later?',
    a: 'Yes, you can upgrade or downgrade your plan at any time from the Settings page. Upgrades take effect immediately, while downgrades apply at the start of your next billing cycle.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes, we use industry-standard encryption and security practices. Your payment information is handled securely by Paystack, and we never store your full card details.',
  },
  {
    q: 'How many groups can I manage?',
    a: 'Basic plan supports 1 group, Smart plan supports up to 5 groups, and the Pro plan allows you to manage unlimited groups.',
  },
]

const FaqPage = () => {
  return (
    <div className="max-w-3xl mx-auto py-10 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Frequently Asked Questions</h1>
        <p className="text-gray-500 mt-2">Everything you need to know about AjoPot.</p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, i) => (
          <Card key={i} className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.q}</h3>
            <p className="text-gray-600 leading-relaxed">{faq.a}</p>
          </Card>
        ))}
      </div>

      <div className="bg-green-50 rounded-2xl p-8 text-center mt-12">
        <h2 className="text-xl font-bold text-green-800">Still have questions?</h2>
        <p className="text-green-700 mt-2 mb-6">We're here to help you manage your ajo groups efficiently.</p>
        <a 
          href="https://wa.me/2348000000000" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
        >
          Contact Support on WhatsApp
        </a>
      </div>
    </div>
  )
}

export default FaqPage;
