import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [createdStoreId, setCreatedStoreId] = useState(null)

  const totalSteps = 7
  const progress = (step / totalSteps) * 100

  const next = () => setStep(s => Math.min(s + 1, totalSteps))
  const back = () => setStep(s => Math.max(s - 1, 1))
  const finish = () => navigate('/dashboard')

  const steps = {
    1: { title: 'Welcome', body: 'Let\'s set up your business in a few quick steps.', canSkip: false, canBack: false },
    2: { title: 'Create Your First Store', body: 'Every business needs at least one store.', canSkip: false, canBack: true },
    3: { title: 'Create Your First Warehouse', body: 'Warehouses hold your inventory.', canSkip: false, canBack: true },
    4: { title: 'Add Your First Product', body: 'You can add more later.', canSkip: true, canBack: true },
    5: { title: 'Add Your First Customer', body: 'Optional — add one to test orders.', canSkip: true, canBack: true },
    6: { title: 'Add a Team Member', body: 'Invite a manager or staff. Optional.', canSkip: true, canBack: true },
    7: { title: 'All Done', body: 'Your MultiDukkan is ready.', canSkip: false, canBack: false },
  }

  const current = steps[step]

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-xl p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Step {step} of {totalSteps}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mb-8 min-h-[200px]">
          <h2 className="text-2xl font-bold text-white mb-2">{current.title}</h2>
          <p className="text-gray-400 mb-6">{current.body}</p>
          <div className="p-6 bg-gray-800 rounded-lg text-gray-500 text-center">
            [Form for step {step} goes here]
          </div>
        </div>

        {/* Nav buttons */}
        <div className="flex justify-between">
          <button
            onClick={back}
            disabled={!current.canBack}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <div className="flex gap-2">
            {current.canSkip && (
              <button onClick={next} className="px-4 py-2 text-gray-400 hover:text-white">
                Skip
              </button>
            )}
            {step < totalSteps ? (
              <button onClick={next} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Next
              </button>
            ) : (
              <button onClick={finish} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}