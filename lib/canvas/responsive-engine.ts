/**
 * Auto-Responsive Engine
 * Automatically converts desktop designs to responsive layouts
 */

interface Breakpoint {
  name: 'mobile' | 'tablet' | 'desktop' | 'wide'
  width: number
  scale: number
  columns: number
}

interface ResponsiveStyles {
  mobile: Record<string, any>
  tablet: Record<string, any>
  desktop: Record<string, any>
}

export class ResponsiveEngine {
  private breakpoints: Breakpoint[] = [
    { name: 'mobile', width: 375, scale: 0.5, columns: 1 },
    { name: 'tablet', width: 768, scale: 0.75, columns: 2 },
    { name: 'desktop', width: 1024, scale: 1, columns: 3 },
    { name: 'wide', width: 1440, scale: 1.2, columns: 4 },
  ]

  /**
   * Analyze canvas layout and detect component patterns
   */
  analyzeLayout(canvasObjects: any[]): {
    layout: 'grid' | 'flex' | 'absolute'
    gridCols?: number
    gridRows?: number
    mainAxis?: 'horizontal' | 'vertical'
  } {
    // Sort objects by position
    const sortedByX = [...canvasObjects].sort((a, b) => (a.left || 0) - (b.left || 0))
    const sortedByY = [...canvasObjects].sort((a, b) => (a.top || 0) - (b.top || 0))

    // Detect grid pattern
    const rows = this.detectRows(sortedByY)
    const cols = this.detectColumns(sortedByX)

    if (rows.length > 1 && cols.length > 1) {
      return {
        layout: 'grid',
        gridCols: cols.length,
        gridRows: rows.length,
      }
    }

    // Detect flex pattern
    const isHorizontal = this.isHorizontalLayout(canvasObjects)
    if (isHorizontal !== null) {
      return {
        layout: 'flex',
        mainAxis: isHorizontal ? 'horizontal' : 'vertical',
      }
    }

    // Default to absolute positioning
    return { layout: 'absolute' }
  }

  /**
   * Generate responsive styles for each breakpoint
   */
  generateResponsiveStyles(
    object: any,
    layout: { layout: string; gridCols?: number }
  ): ResponsiveStyles {
    const baseStyles = this.extractBaseStyles(object)
    
    return {
      mobile: this.adaptForMobile(baseStyles, layout),
      tablet: this.adaptForTablet(baseStyles, layout),
      desktop: baseStyles,
    }
  }

  /**
   * Convert absolute positions to responsive grid/flex
   */
  convertToResponsiveLayout(canvasObjects: any[]): string {
    const layout = this.analyzeLayout(canvasObjects)
    
    if (layout.layout === 'grid') {
      return this.generateGridCSS(canvasObjects, layout.gridCols!, layout.gridRows!)
    } else if (layout.layout === 'flex') {
      return this.generateFlexCSS(canvasObjects, layout.mainAxis!)
    } else {
      return this.generateAbsoluteCSS(canvasObjects)
    }
  }

  /**
   * Generate responsive React component
   */
  generateResponsiveComponent(canvasObjects: any[]): string {
    const layout = this.analyzeLayout(canvasObjects)
    
    return `
import { useState, useEffect } from 'react'

export default function ResponsiveComponent() {
  const [screenSize, setScreenSize] = useState('desktop')
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      if (width < 640) setScreenSize('mobile')
      else if (width < 1024) setScreenSize('tablet')
      else setScreenSize('desktop')
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={\`
      \${screenSize === 'mobile' ? 'px-4' : ''}
      \${screenSize === 'tablet' ? 'px-8' : ''}
      \${screenSize === 'desktop' ? 'px-16' : ''}
    \`}>
      ${this.generateLayoutJSX(canvasObjects, layout)}
    </div>
  )
}`
  }

  /**
   * Smart breakpoint detection based on content
   */
  detectOptimalBreakpoints(canvasObjects: any[]): number[] {
    const widths = canvasObjects.map(obj => (obj.left || 0) + (obj.width || 0))
    const maxWidth = Math.max(...widths)
    
    const breakpoints: number[] = []
    
    // Mobile breakpoint - single column
    if (maxWidth > 400) breakpoints.push(375)
    
    // Tablet breakpoint - two columns
    if (maxWidth > 800) breakpoints.push(768)
    
    // Desktop breakpoint - full width
    breakpoints.push(Math.min(maxWidth, 1200))
    
    return breakpoints
  }

  /**
   * Private helper methods
   */
  private detectRows(sortedObjects: any[]): number[][] {
    const rows: number[][] = []
    let currentRow: number[] = []
    let lastY = -Infinity
    const threshold = 50 // Pixels threshold for same row

    sortedObjects.forEach((obj, index) => {
      const y = obj.top || 0
      
      if (Math.abs(y - lastY) > threshold && currentRow.length > 0) {
        rows.push(currentRow)
        currentRow = [index]
      } else {
        currentRow.push(index)
      }
      
      lastY = y
    })
    
    if (currentRow.length > 0) rows.push(currentRow)
    return rows
  }

  private detectColumns(sortedObjects: any[]): number[][] {
    const cols: number[][] = []
    let currentCol: number[] = []
    let lastX = -Infinity
    const threshold = 50 // Pixels threshold for same column

    sortedObjects.forEach((obj, index) => {
      const x = obj.left || 0
      
      if (Math.abs(x - lastX) > threshold && currentCol.length > 0) {
        cols.push(currentCol)
        currentCol = [index]
      } else {
        currentCol.push(index)
      }
      
      lastX = x
    })
    
    if (currentCol.length > 0) cols.push(currentCol)
    return cols
  }

  private isHorizontalLayout(objects: any[]): boolean | null {
    if (objects.length < 2) return null
    
    const avgXDiff = objects.reduce((sum, obj, i) => {
      if (i === 0) return 0
      return sum + Math.abs((obj.left || 0) - (objects[i - 1].left || 0))
    }, 0) / (objects.length - 1)
    
    const avgYDiff = objects.reduce((sum, obj, i) => {
      if (i === 0) return 0
      return sum + Math.abs((obj.top || 0) - (objects[i - 1].top || 0))
    }, 0) / (objects.length - 1)
    
    if (avgXDiff > avgYDiff * 2) return true
    if (avgYDiff > avgXDiff * 2) return false
    return null
  }

  private extractBaseStyles(object: any): Record<string, any> {
    return {
      width: object.width,
      height: object.height,
      padding: this.calculatePadding(object),
      margin: this.calculateMargin(object),
      fontSize: object.fontSize || 16,
      color: object.fill,
      backgroundColor: object.backgroundColor,
    }
  }

  private adaptForMobile(
    styles: Record<string, any>,
    layout: { layout: string; gridCols?: number }
  ): Record<string, any> {
    const mobileStyles = { ...styles }
    
    // Responsive width
    if (layout.layout === 'grid' || layout.layout === 'flex') {
      mobileStyles.width = '100%'
    } else if (styles.width > 300) {
      mobileStyles.width = '100%'
      mobileStyles.maxWidth = styles.width
    }
    
    // Scale down text
    if (styles.fontSize) {
      mobileStyles.fontSize = Math.max(14, styles.fontSize * 0.85)
    }
    
    // Reduce padding/margin
    if (styles.padding) {
      mobileStyles.padding = this.scalePadding(styles.padding, 0.75)
    }
    if (styles.margin) {
      mobileStyles.margin = this.scaleMargin(styles.margin, 0.75)
    }
    
    return mobileStyles
  }

  private adaptForTablet(
    styles: Record<string, any>,
    layout: { layout: string; gridCols?: number }
  ): Record<string, any> {
    const tabletStyles = { ...styles }
    
    // Responsive width
    if (layout.layout === 'grid' && layout.gridCols && layout.gridCols > 2) {
      tabletStyles.width = '50%'
    } else if (layout.layout === 'flex') {
      tabletStyles.width = 'auto'
      tabletStyles.flex = '1 1 45%'
    }
    
    // Slightly scale text
    if (styles.fontSize) {
      tabletStyles.fontSize = Math.max(15, styles.fontSize * 0.9)
    }
    
    // Slightly reduce padding/margin
    if (styles.padding) {
      tabletStyles.padding = this.scalePadding(styles.padding, 0.85)
    }
    if (styles.margin) {
      tabletStyles.margin = this.scaleMargin(styles.margin, 0.85)
    }
    
    return tabletStyles
  }

  private generateGridCSS(objects: any[], cols: number, rows: number): string {
    return `
.container {
  display: grid;
  grid-template-columns: repeat(${cols}, 1fr);
  grid-template-rows: repeat(${rows}, auto);
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}`
  }

  private generateFlexCSS(objects: any[], mainAxis: 'horizontal' | 'vertical'): string {
    return `
.container {
  display: flex;
  flex-direction: ${mainAxis === 'horizontal' ? 'row' : 'column'};
  flex-wrap: wrap;
  gap: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: ${mainAxis === 'horizontal' ? 'column' : 'column'};
  }
  
  .item {
    flex: 1 1 calc(33.333% - 1rem);
    
    @media (max-width: 1024px) {
      flex: 1 1 calc(50% - 1rem);
    }
    
    @media (max-width: 640px) {
      flex: 1 1 100%;
    }
  }
}`
  }

  private generateAbsoluteCSS(objects: any[]): string {
    return `
.container {
  position: relative;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
}`
  }

  private generateLayoutJSX(objects: any[], layout: any): string {
    if (layout.layout === 'grid') {
      return `
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${layout.gridCols} gap-4">
        ${objects.map((obj, i) => `
        <div key={${i}} className="bg-white rounded-lg shadow p-4">
          {/* Component ${i + 1} */}
        </div>
        `).join('')}
      </div>`
    } else if (layout.layout === 'flex') {
      return `
      <div className="flex ${layout.mainAxis === 'horizontal' ? 'flex-row' : 'flex-col'} flex-wrap gap-4">
        ${objects.map((obj, i) => `
        <div key={${i}} className="flex-1 min-w-[250px] bg-white rounded-lg shadow p-4">
          {/* Component ${i + 1} */}
        </div>
        `).join('')}
      </div>`
    } else {
      return `
      <div className="relative">
        ${objects.map((obj, i) => `
        <div key={${i}} className="absolute" style={{ left: '${obj.left}px', top: '${obj.top}px' }}>
          {/* Component ${i + 1} */}
        </div>
        `).join('')}
      </div>`
    }
  }

  private calculatePadding(object: any): string {
    // Intelligent padding calculation based on object type
    if (object.type === 'group') return '1rem'
    if (object.type === 'rect' && object.fill) return '0.75rem'
    return '0'
  }

  private calculateMargin(object: any): string {
    // Intelligent margin calculation based on position
    return '0.5rem'
  }

  private scalePadding(padding: string, scale: number): string {
    const value = parseFloat(padding)
    const unit = padding.replace(/[0-9.]/g, '')
    return `${value * scale}${unit}`
  }

  private scaleMargin(margin: string, scale: number): string {
    const value = parseFloat(margin)
    const unit = margin.replace(/[0-9.]/g, '')
    return `${value * scale}${unit}`
  }

  /**
   * Generate Tailwind classes for responsive design
   */
  generateTailwindClasses(object: any): string {
    const classes: string[] = []
    
    // Width classes
    if (object.width > 900) {
      classes.push('w-full')
    } else if (object.width > 600) {
      classes.push('w-full lg:w-3/4')
    } else if (object.width > 300) {
      classes.push('w-full md:w-1/2')
    } else {
      classes.push('w-full sm:w-auto')
    }
    
    // Responsive padding
    classes.push('p-2 sm:p-4 lg:p-6')
    
    // Responsive text
    if (object.fontSize) {
      if (object.fontSize > 32) {
        classes.push('text-2xl sm:text-3xl lg:text-4xl')
      } else if (object.fontSize > 20) {
        classes.push('text-lg sm:text-xl lg:text-2xl')
      } else {
        classes.push('text-sm sm:text-base')
      }
    }
    
    return classes.join(' ')
  }
}