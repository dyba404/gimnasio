import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppSidebar } from '../AppSidebar'
import { FooterVersion } from '../FooterVersion'
import { SidebarProvider } from '@/components/ui/sidebar'

function renderAppSidebar(): string {
  return renderToStaticMarkup(
    <MemoryRouter>
      <SidebarProvider>
        <AppSidebar />
      </SidebarProvider>
    </MemoryRouter>,
  )
}

describe('FooterVersion — bloque de marca del sidebar', () => {
  it('renderiza el texto de marca dentro del árbol del AppSidebar', () => {
    const html = renderAppSidebar()
    expect(html).toContain('Marsmode')
  })

  it('vive en el SidebarFooter, dentro del children que la variante Sheet móvil renderiza íntegro', () => {
    const html = renderAppSidebar()
    const indiceFooter = html.indexOf('data-sidebar="footer"')
    const indiceMarca = html.indexOf('Marsmode', indiceFooter)
    expect(indiceFooter).toBeGreaterThan(-1)
    expect(indiceMarca).toBeGreaterThan(indiceFooter)
  })

  it('no usa clases que lo oculten en la variante móvil (solo se oculta en desktop colapsado por icono)', () => {
    const html = renderToStaticMarkup(<FooterVersion />)
    expect(html).not.toContain('md:hidden')
    expect(html).not.toMatch(/class="[^"]*(?:^|\s)hidden(?:\s|")/)
    expect(html).toContain('group-data-[collapsible=icon]:hidden')
  })
})
