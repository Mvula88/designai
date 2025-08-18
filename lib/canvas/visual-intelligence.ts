/**
 * Visual Intelligence System
 * Transforms canvas designs into production-ready components
 */

import * as fabric from 'fabric'

export interface ComponentMapping {
  type: 'button' | 'input' | 'card' | 'navbar' | 'form' | 'container' | 'text' | 'image' | 'icon'
  props: Record<string, any>
  children?: ComponentMapping[]
  code: string
}

export class VisualIntelligence {
  private canvas: fabric.Canvas
  private components: Map<string, ComponentMapping> = new Map()

  constructor(canvas: fabric.Canvas) {
    this.canvas = canvas
  }

  /**
   * Analyze canvas and identify component patterns
   */
  analyzeDesign(): ComponentMapping[] {
    const objects = this.canvas.getObjects()
    const components: ComponentMapping[] = []
    const processed = new Set<fabric.Object>()

    // First pass: Identify high-level components
    objects.forEach(obj => {
      if (processed.has(obj)) return

      // Check for component patterns
      if (this.isButton(obj)) {
        components.push(this.createButton(obj))
        processed.add(obj)
      } else if (this.isInputField(obj)) {
        components.push(this.createInput(obj))
        processed.add(obj)
      } else if (this.isCard(obj)) {
        const card = this.createCard(obj)
        components.push(card)
        this.markGroupProcessed(obj, processed)
      } else if (this.isNavbar(obj)) {
        const navbar = this.createNavbar(obj)
        components.push(navbar)
        this.markGroupProcessed(obj, processed)
      }
    })

    // Second pass: Handle remaining objects
    objects.forEach(obj => {
      if (!processed.has(obj)) {
        components.push(this.createGenericComponent(obj))
      }
    })

    return this.optimizeComponentTree(components)
  }

  /**
   * Pattern detection methods
   */
  private isButton(obj: fabric.Object): boolean {
    if (obj.type !== 'group' && obj.type !== 'rect') return false
    
    // Check for button-like properties
    const hasRoundedCorners = (obj as any).rx > 0 || (obj as any).ry > 0
    const hasText = obj.type === 'group' && 
      (obj as fabric.Group).getObjects().some(o => o.type === 'text')
    const aspectRatio = (obj.width || 0) / (obj.height || 1)
    
    return hasRoundedCorners && hasText && aspectRatio > 2 && aspectRatio < 6
  }

  private isInputField(obj: fabric.Object): boolean {
    if (obj.type !== 'rect') return false
    
    const rect = obj as fabric.Rect
    const aspectRatio = (rect.width || 0) / (rect.height || 1)
    const hasLightBackground = rect.fill === '#ffffff' || rect.fill === '#f9f9f9'
    const hasBorder = rect.stroke !== undefined
    
    return aspectRatio > 4 && hasLightBackground && hasBorder
  }

  private isCard(obj: fabric.Object): boolean {
    if (obj.type !== 'group') return false
    
    const group = obj as fabric.Group
    const objects = group.getObjects()
    
    // Card usually has: background rect + text + optional image
    const hasBackground = objects.some(o => o.type === 'rect' && o.fill)
    const hasText = objects.some(o => o.type === 'text')
    
    return hasBackground && hasText && objects.length >= 2
  }

  private isNavbar(obj: fabric.Object): boolean {
    if (obj.type !== 'group' && obj.type !== 'rect') return false
    
    // Navbar is usually at the top, full width
    const isTopPosition = (obj.top || 0) < 100
    const isWideEnough = (obj.width || 0) > this.canvas.width! * 0.8
    
    return isTopPosition && isWideEnough
  }

  /**
   * Component creation methods
   */
  private createButton(obj: fabric.Object): ComponentMapping {
    const text = this.extractText(obj)
    const styles = this.extractStyles(obj)
    
    return {
      type: 'button',
      props: {
        label: text || 'Button',
        variant: this.detectButtonVariant(styles),
        onClick: '() => console.log("Button clicked")',
        ...styles
      },
      code: this.generateButtonCode(text || 'Button', styles)
    }
  }

  private createInput(obj: fabric.Object): ComponentMapping {
    const rect = obj as fabric.Rect
    const styles = this.extractStyles(rect)
    
    // Look for nearby label
    const label = this.findNearbyLabel(rect)
    
    return {
      type: 'input',
      props: {
        placeholder: label || 'Enter text...',
        type: this.detectInputType(label),
        ...styles
      },
      code: this.generateInputCode(label, styles)
    }
  }

  private createCard(obj: fabric.Object): ComponentMapping {
    const group = obj as fabric.Group
    const objects = group.getObjects()
    const styles = this.extractStyles(group)
    
    // Extract card content
    const title = objects.find(o => o.type === 'text' && (o as fabric.Text).fontSize! > 16)
    const description = objects.find(o => o.type === 'text' && o !== title)
    const image = objects.find(o => o.type === 'image')
    
    return {
      type: 'card',
      props: {
        title: title ? (title as fabric.Text).text : 'Card Title',
        description: description ? (description as fabric.Text).text : 'Card description',
        image: image ? (image as fabric.Image).getSrc() : null,
        ...styles
      },
      code: this.generateCardCode(
        title ? (title as fabric.Text).text! : 'Card Title',
        description ? (description as fabric.Text).text! : 'Card description',
        styles
      )
    }
  }

  private createNavbar(obj: fabric.Object): ComponentMapping {
    const styles = this.extractStyles(obj)
    
    // Extract navigation items
    const items = this.extractNavItems(obj)
    
    return {
      type: 'navbar',
      props: {
        brand: 'DesignOS',
        items,
        ...styles
      },
      code: this.generateNavbarCode(items, styles)
    }
  }

  private createGenericComponent(obj: fabric.Object): ComponentMapping {
    const styles = this.extractStyles(obj)
    
    switch (obj.type) {
      case 'text':
        return this.createTextComponent(obj as fabric.Text)
      case 'image':
        return this.createImageComponent(obj as fabric.Image)
      case 'rect':
        return this.createContainerComponent(obj as fabric.Rect)
      default:
        return {
          type: 'container',
          props: styles,
          code: '<div />'
        }
    }
  }

  /**
   * Helper methods
   */
  private extractText(obj: fabric.Object): string | null {
    if (obj.type === 'text') {
      return (obj as fabric.Text).text || null
    }
    if (obj.type === 'group') {
      const textObj = (obj as fabric.Group).getObjects().find(o => o.type === 'text')
      return textObj ? (textObj as fabric.Text).text || null : null
    }
    return null
  }

  private extractStyles(obj: fabric.Object): Record<string, any> {
    return {
      width: obj.width,
      height: obj.height,
      backgroundColor: obj.fill,
      borderColor: obj.stroke,
      borderWidth: obj.strokeWidth,
      borderRadius: (obj as any).rx || 0,
      opacity: obj.opacity,
      position: {
        x: obj.left,
        y: obj.top
      }
    }
  }

  private detectButtonVariant(styles: Record<string, any>): string {
    if (styles.backgroundColor === '#000000' || styles.backgroundColor === '#111111') {
      return 'primary'
    }
    if (!styles.backgroundColor || styles.backgroundColor === 'transparent') {
      return 'outline'
    }
    return 'secondary'
  }

  private detectInputType(label: string | null): string {
    if (!label) return 'text'
    
    const lower = label.toLowerCase()
    if (lower.includes('email')) return 'email'
    if (lower.includes('password')) return 'password'
    if (lower.includes('phone') || lower.includes('tel')) return 'tel'
    if (lower.includes('number') || lower.includes('amount')) return 'number'
    if (lower.includes('date')) return 'date'
    
    return 'text'
  }

  private findNearbyLabel(input: fabric.Rect): string | null {
    const objects = this.canvas.getObjects()
    const inputBounds = input.getBoundingRect()
    
    // Look for text above or to the left of the input
    for (const obj of objects) {
      if (obj.type !== 'text') continue
      
      const text = obj as fabric.Text
      const textBounds = text.getBoundingRect()
      
      // Check if text is above the input
      if (textBounds.top < inputBounds.top && 
          Math.abs(textBounds.left - inputBounds.left) < 50) {
        return text.text || null
      }
      
      // Check if text is to the left of the input
      if (textBounds.left < inputBounds.left && 
          Math.abs(textBounds.top - inputBounds.top) < 20) {
        return text.text || null
      }
    }
    
    return null
  }

  private extractNavItems(obj: fabric.Object): string[] {
    if (obj.type === 'group') {
      const group = obj as fabric.Group
      return group.getObjects()
        .filter(o => o.type === 'text')
        .map(o => (o as fabric.Text).text || 'Nav Item')
    }
    return ['Home', 'About', 'Services', 'Contact']
  }

  private markGroupProcessed(obj: fabric.Object, processed: Set<fabric.Object>) {
    processed.add(obj)
    if (obj.type === 'group') {
      (obj as fabric.Group).getObjects().forEach(o => processed.add(o))
    }
  }

  private createTextComponent(text: fabric.Text): ComponentMapping {
    const fontSize = text.fontSize || 16
    const fontWeight = text.fontWeight
    
    let type: ComponentMapping['type'] = 'text'
    let tag = 'p'
    
    if (fontSize > 32) tag = 'h1'
    else if (fontSize > 24) tag = 'h2'
    else if (fontSize > 18) tag = 'h3'
    else if (fontWeight === 'bold') tag = 'strong'
    
    return {
      type,
      props: {
        text: text.text,
        tag,
        fontSize,
        fontWeight,
        color: text.fill
      },
      code: `<${tag}>${text.text}</${tag}>`
    }
  }

  private createImageComponent(image: fabric.Image): ComponentMapping {
    return {
      type: 'image',
      props: {
        src: image.getSrc(),
        alt: 'Image',
        width: image.width,
        height: image.height
      },
      code: `<Image src="${image.getSrc()}" alt="Image" width={${image.width}} height={${image.height}} />`
    }
  }

  private createContainerComponent(rect: fabric.Rect): ComponentMapping {
    return {
      type: 'container',
      props: this.extractStyles(rect),
      code: '<div className="container" />'
    }
  }

  /**
   * Code generation methods
   */
  private generateButtonCode(label: string, styles: Record<string, any>): string {
    return `
<button
  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
  onClick={() => console.log('${label} clicked')}
>
  ${label}
</button>`
  }

  private generateInputCode(label: string | null, styles: Record<string, any>): string {
    return `
<div className="mb-4">
  ${label ? `<label className="block text-sm font-medium mb-2">${label}</label>` : ''}
  <input
    type="text"
    placeholder="${label || 'Enter text...'}"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>`
  }

  private generateCardCode(title: string, description: string, styles: Record<string, any>): string {
    return `
<div className="bg-white rounded-lg shadow-lg p-6">
  <h3 className="text-xl font-semibold mb-2">${title}</h3>
  <p className="text-gray-600">${description}</p>
</div>`
  }

  private generateNavbarCode(items: string[], styles: Record<string, any>): string {
    const navItems = items.map(item => `
    <a href="#" className="text-gray-700 hover:text-blue-600">${item}</a>`).join('')
    
    return `
<nav className="bg-white shadow-sm px-6 py-4">
  <div className="flex justify-between items-center">
    <div className="text-xl font-bold">DesignOS</div>
    <div className="flex gap-6">
      ${navItems}
    </div>
  </div>
</nav>`
  }

  private optimizeComponentTree(components: ComponentMapping[]): ComponentMapping[] {
    // Group components by position to create proper layout
    // This is where we'd add responsive grid system
    return components
  }

  /**
   * Generate complete React app from canvas
   */
  generateReactApp(): string {
    const components = this.analyzeDesign()
    
    const imports = `
import React from 'react'
import Image from 'next/image'

`
    
    const componentCode = components.map(c => c.code).join('\n')
    
    return `
${imports}
export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      ${componentCode}
    </div>
  )
}`
  }
}