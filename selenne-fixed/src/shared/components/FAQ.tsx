import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Send } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  helpful?: boolean;
}

interface FAQProps {
  items: FAQItem[];
  title?: string;
  subtitle?: string;
  onSubmitQuestion?: (question: string, email: string) => void;
  showForm?: boolean;
  className?: string;
}

export const FAQ: React.FC<FAQProps> = ({
  items,
  title = 'Preguntas Frecuentes',
  subtitle = 'Encuentra respuestas a tus dudas',
  onSubmitQuestion,
  showForm = true,
  className = '',
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [questionEmail, setQuestionEmail] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [submittedQuestion, setSubmittedQuestion] = useState(false);

  const categories = Array.from(
    new Set(items.filter((item) => item.category).map((item) => item.category))
  );

  const filteredItems = items.filter((item) =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (questionText.trim() && questionEmail.trim()) {
      onSubmitQuestion?.(questionText, questionEmail);
      setQuestionText('');
      setQuestionEmail('');
      setSubmittedQuestion(true);
      setTimeout(() => setSubmittedQuestion(false), 3000);
    }
  };

  return (
    <div className={`py-12 ${className}`}>
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <HelpCircle className="w-6 h-6 text-[#d65391]" />
          <h2
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="text-3xl md:text-4xl font-bold text-gray-900"
          >
            {title}
          </h2>
        </div>
        {subtitle && (
          <p
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="text-gray-600 text-lg"
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Search */}
      <div className="mb-8 max-w-2xl mx-auto px-4 sm:px-0">
        <input
          type="text"
          placeholder="Buscar preguntas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] transition-all duration-200"
        />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mb-8 max-w-2xl mx-auto px-4 sm:px-0 flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              className="px-4 py-2 rounded-full border border-gray-200 hover:border-[#d65391] hover:bg-[#d65391]/10 transition-all duration-200 text-sm font-medium text-gray-700 hover:text-[#d65391]"
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* FAQ Items */}
      <div className="max-w-2xl mx-auto px-4 sm:px-0 space-y-3 mb-12">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:border-[#d65391]"
          >
            {/* Question */}
            <button
              onClick={() =>
                setExpandedId(expandedId === item.id ? null : item.id)
              }
              className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="text-left flex-1">
                <h3
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-lg font-semibold text-gray-900"
                >
                  {item.question}
                </h3>
                {item.category && (
                  <span
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="text-xs text-gray-500 mt-1 inline-block"
                  >
                    {item.category}
                  </span>
                )}
              </div>

              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-4 ${
                  expandedId === item.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Answer */}
            {expandedId === item.id && (
              <div className="border-t border-gray-200 p-6 bg-gray-50 animate-in fade-in slide-in-from-top-2 duration-300">
                <p
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="text-gray-700 leading-relaxed mb-4"
                >
                  {item.answer}
                </p>

                <div className="flex items-center gap-4 text-sm">
                  <span
                    style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                    className="text-gray-600"
                  >
                    ¿Fue útil?
                  </span>
                  <button className="text-gray-500 hover:text-green-600 transition-colors">
                    👍 Sí
                  </button>
                  <button className="text-gray-500 hover:text-red-600 transition-colors">
                    👎 No
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p
              style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
              className="text-gray-600"
            >
              No encontramos respuestas para "{searchQuery}"
            </p>
          </div>
        )}
      </div>

      {/* Contact Form */}
      {showForm && (
        <div className="max-w-2xl mx-auto px-4 sm:px-0 bg-gradient-to-r from-[#d65391]/10 to-[#f8a9c5]/10 rounded-xl p-8">
          <h3
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="text-2xl font-bold text-gray-900 mb-4"
          >
            ¿No encontraste lo que buscas?
          </h3>

          <p
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="text-gray-600 mb-6"
          >
            Contáctanos y nuestro equipo te responderá lo antes posible.
          </p>

          {submittedQuestion ? (
            <div className="bg-green-100 border border-green-300 text-green-800 px-4 py-3 rounded-lg text-sm">
              ✓ Gracias por tu pregunta. Nos pondremos en contacto pronto.
            </div>
          ) : (
            <form onSubmit={handleSubmitQuestion} className="space-y-4">
              <div>
                <label
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Tu correo electrónico
                </label>
                <input
                  type="email"
                  value={questionEmail}
                  onChange={(e) => setQuestionEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391]"
                />
              </div>

              <div>
                <label
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="block text-sm font-medium text-gray-900 mb-2"
                >
                  Tu pregunta
                </label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="Cuéntanos cómo podemos ayudarte..."
                  required
                  rows={4}
                  style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d65391] resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#d65391] to-[#f8a9c5] hover:shadow-lg text-white font-medium py-3 rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Enviar Pregunta
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default FAQ;
