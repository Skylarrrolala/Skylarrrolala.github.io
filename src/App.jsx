import Lanyard from './components/Lanyard'

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-white">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left — text */}
          <div>
            <p className="font-mono text-xs text-accent tracking-widest uppercase mb-6">
              Available for Opportunities
            </p>
            <h1 className="text-6xl font-black leading-none mb-2">Dararithy</h1>
            <h1 className="text-6xl font-black leading-none mb-6 bg-gradient-to-r from-accent to-mint bg-clip-text text-transparent">
              Heng
            </h1>
            <p className="text-muted text-sm mb-8 max-w-md leading-relaxed">
              CS student with hands-on experience in project coordination, digital strategy,
              and cross-functional collaboration. Aspiring Product Manager passionate about
              building impactful solutions.
            </p>
            <div className="flex gap-4">
              <a href="#projects" className="bg-accent text-white px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-accent/90 transition-colors">
                View My Work →
              </a>
              <a href="#contact" className="border border-accent/40 text-accent px-8 py-3 text-xs font-bold tracking-widest uppercase hover:bg-accent/10 transition-colors">
                Let's Talk ↗
              </a>
            </div>
          </div>

          {/* Right — Lanyard */}
          <div className="flex items-center justify-center h-[600px]">
            <Lanyard />
          </div>
        </div>
      </section>
    </div>
  )
}
