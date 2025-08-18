'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Database, 
  Plus, 
  Link2, 
  Trash2, 
  Save,
  Settings,
  Key,
  Type,
  Hash,
  Calendar,
  ToggleLeft,
  Image,
  FileText,
  ChevronDown,
  ChevronRight,
  Zap,
  Code2,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface TableField {
  id: string
  name: string
  type: 'text' | 'number' | 'boolean' | 'date' | 'image' | 'json' | 'uuid'
  required: boolean
  unique: boolean
  isPrimary?: boolean
  isForeign?: boolean
  references?: { table: string; field: string }
}

interface Table {
  id: string
  name: string
  x: number
  y: number
  fields: TableField[]
  color: string
}

interface Relationship {
  id: string
  from: { table: string; field: string }
  to: { table: string; field: string }
  type: 'one-to-one' | 'one-to-many' | 'many-to-many'
}

const fieldTypeIcons = {
  text: <Type className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  boolean: <ToggleLeft className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  json: <FileText className="h-4 w-4" />,
  uuid: <Key className="h-4 w-4" />,
}

const tableColors = [
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#ec4899', // Pink
]

export function VisualDatabaseDesigner({ onGenerate }: { onGenerate?: (schema: any) => void }) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [tables, setTables] = useState<Table[]>([])
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [draggingTable, setDraggingTable] = useState<string | null>(null)
  const [showFieldEditor, setShowFieldEditor] = useState(false)
  const [editingField, setEditingField] = useState<TableField | null>(null)
  const [connectionMode, setConnectionMode] = useState(false)
  const [connectionStart, setConnectionStart] = useState<{ table: string; field: string } | null>(null)

  // Add default tables for common patterns
  const addCommonTable = (type: 'users' | 'products' | 'orders' | 'posts') => {
    const templates = {
      users: {
        name: 'users',
        fields: [
          { id: '1', name: 'id', type: 'uuid' as const, required: true, unique: true, isPrimary: true },
          { id: '2', name: 'email', type: 'text' as const, required: true, unique: true },
          { id: '3', name: 'name', type: 'text' as const, required: true, unique: false },
          { id: '4', name: 'avatar', type: 'image' as const, required: false, unique: false },
          { id: '5', name: 'created_at', type: 'date' as const, required: true, unique: false },
        ]
      },
      products: {
        name: 'products',
        fields: [
          { id: '1', name: 'id', type: 'uuid' as const, required: true, unique: true, isPrimary: true },
          { id: '2', name: 'name', type: 'text' as const, required: true, unique: false },
          { id: '3', name: 'price', type: 'number' as const, required: true, unique: false },
          { id: '4', name: 'image', type: 'image' as const, required: false, unique: false },
          { id: '5', name: 'stock', type: 'number' as const, required: true, unique: false },
        ]
      },
      orders: {
        name: 'orders',
        fields: [
          { id: '1', name: 'id', type: 'uuid' as const, required: true, unique: true, isPrimary: true },
          { id: '2', name: 'user_id', type: 'uuid' as const, required: true, unique: false, isForeign: true },
          { id: '3', name: 'total', type: 'number' as const, required: true, unique: false },
          { id: '4', name: 'status', type: 'text' as const, required: true, unique: false },
          { id: '5', name: 'created_at', type: 'date' as const, required: true, unique: false },
        ]
      },
      posts: {
        name: 'posts',
        fields: [
          { id: '1', name: 'id', type: 'uuid' as const, required: true, unique: true, isPrimary: true },
          { id: '2', name: 'title', type: 'text' as const, required: true, unique: false },
          { id: '3', name: 'content', type: 'text' as const, required: true, unique: false },
          { id: '4', name: 'author_id', type: 'uuid' as const, required: true, unique: false, isForeign: true },
          { id: '5', name: 'published', type: 'boolean' as const, required: true, unique: false },
        ]
      }
    }

    const template = templates[type]
    const newTable: Table = {
      id: `table-${Date.now()}`,
      name: template.name,
      x: 100 + tables.length * 50,
      y: 100 + tables.length * 50,
      fields: template.fields,
      color: tableColors[tables.length % tableColors.length],
    }

    setTables([...tables, newTable])
    toast.success(`Added ${type} table`)
  }

  const addCustomTable = () => {
    const newTable: Table = {
      id: `table-${Date.now()}`,
      name: `table_${tables.length + 1}`,
      x: 100 + tables.length * 50,
      y: 100 + tables.length * 50,
      fields: [
        { id: '1', name: 'id', type: 'uuid', required: true, unique: true, isPrimary: true },
      ],
      color: tableColors[tables.length % tableColors.length],
    }
    setTables([...tables, newTable])
    setSelectedTable(newTable.id)
    setShowFieldEditor(true)
  }

  const generateSupabaseSchema = () => {
    const schema = {
      tables: tables.map(table => ({
        name: table.name,
        columns: table.fields.map(field => ({
          name: field.name,
          type: field.type === 'text' ? 'varchar' : field.type,
          required: field.required,
          unique: field.unique,
          primary: field.isPrimary,
          foreign: field.isForeign ? field.references : null,
        }))
      })),
      relationships: relationships.map(rel => ({
        from: rel.from,
        to: rel.to,
        type: rel.type,
      }))
    }

    // Generate SQL
    const sql = tables.map(table => {
      const columns = table.fields.map(field => {
        let col = `  ${field.name} ${field.type === 'text' ? 'VARCHAR(255)' : field.type.toUpperCase()}`
        if (field.required) col += ' NOT NULL'
        if (field.unique) col += ' UNIQUE'
        if (field.isPrimary) col += ' PRIMARY KEY'
        return col
      }).join(',\n')

      return `CREATE TABLE ${table.name} (\n${columns}\n);`
    }).join('\n\n')

    if (onGenerate) {
      onGenerate({ schema, sql })
    }

    toast.success('Database schema generated!')
    return { schema, sql }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Database className="h-5 w-5" />
            Visual Database Designer
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Design your database visually. AI will generate the schema and APIs.
          </p>
        </div>

        {/* Quick Add Tables */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Add Tables</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addCommonTable('users')}
              className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-colors"
            >
              Users
            </button>
            <button
              onClick={() => addCommonTable('products')}
              className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
            >
              Products
            </button>
            <button
              onClick={() => addCommonTable('orders')}
              className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              Orders
            </button>
            <button
              onClick={() => addCommonTable('posts')}
              className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors"
            >
              Posts
            </button>
          </div>
          <button
            onClick={addCustomTable}
            className="w-full mt-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Custom Table
          </button>
        </div>

        {/* Tables List */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Tables ({tables.length})</h4>
          <div className="space-y-2">
            {tables.map(table => (
              <div
                key={table.id}
                onClick={() => setSelectedTable(table.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedTable === table.id 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: table.color }}
                    />
                    <span className="font-medium text-gray-900">{table.name}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500">
                  {table.fields.length} fields
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => setConnectionMode(!connectionMode)}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              connectionMode 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Link2 className="h-4 w-4" />
            {connectionMode ? 'Creating Relationship...' : 'Add Relationship'}
          </button>
          
          <button
            onClick={generateSupabaseSchema}
            className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Generate Schema
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div 
        ref={canvasRef}
        className="flex-1 bg-gray-50 relative overflow-auto"
        style={{ 
          backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
          backgroundSize: '20px 20px' 
        }}
      >
        {/* Tables */}
        {tables.map(table => (
          <div
            key={table.id}
            className="absolute bg-white rounded-lg shadow-lg border-2 min-w-[250px]"
            style={{ 
              left: table.x, 
              top: table.y,
              borderColor: table.color,
            }}
            draggable
            onDragStart={() => setDraggingTable(table.id)}
            onDragEnd={(e) => {
              const rect = canvasRef.current?.getBoundingClientRect()
              if (rect) {
                setTables(tables.map(t => 
                  t.id === table.id 
                    ? { ...t, x: e.clientX - rect.left, y: e.clientY - rect.top }
                    : t
                ))
              }
              setDraggingTable(null)
            }}
          >
            {/* Table Header */}
            <div 
              className="px-4 py-2 rounded-t-lg text-white font-medium flex items-center justify-between"
              style={{ backgroundColor: table.color }}
            >
              <span>{table.name}</span>
              <Database className="h-4 w-4 opacity-60" />
            </div>

            {/* Fields */}
            <div className="p-2">
              {table.fields.map(field => (
                <div
                  key={field.id}
                  className="px-2 py-1.5 hover:bg-gray-50 rounded flex items-center gap-2 text-sm"
                  onClick={() => {
                    if (connectionMode && !connectionStart) {
                      setConnectionStart({ table: table.id, field: field.id })
                      toast.info('Select target field')
                    } else if (connectionMode && connectionStart) {
                      // Create relationship
                      const newRel: Relationship = {
                        id: `rel-${Date.now()}`,
                        from: connectionStart,
                        to: { table: table.id, field: field.id },
                        type: 'one-to-many',
                      }
                      setRelationships([...relationships, newRel])
                      setConnectionMode(false)
                      setConnectionStart(null)
                      toast.success('Relationship created')
                    }
                  }}
                >
                  {field.isPrimary && <Key className="h-3 w-3 text-yellow-500" />}
                  {field.isForeign && <Link2 className="h-3 w-3 text-blue-500" />}
                  {fieldTypeIcons[field.type]}
                  <span className="flex-1 text-gray-700">{field.name}</span>
                  <span className="text-xs text-gray-400">{field.type}</span>
                </div>
              ))}
            </div>

            {/* Add Field Button */}
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={() => {
                  setSelectedTable(table.id)
                  setShowFieldEditor(true)
                }}
                className="w-full px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 rounded flex items-center justify-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Add Field
              </button>
            </div>
          </div>
        ))}

        {/* Relationships SVG */}
        <svg className="absolute inset-0 pointer-events-none">
          {relationships.map(rel => {
            const fromTable = tables.find(t => t.id === rel.from.table)
            const toTable = tables.find(t => t.id === rel.to.table)
            
            if (!fromTable || !toTable) return null

            return (
              <line
                key={rel.id}
                x1={fromTable.x + 125}
                y1={fromTable.y + 50}
                x2={toTable.x + 125}
                y2={toTable.y + 50}
                stroke="#9ca3af"
                strokeWidth="2"
                strokeDasharray="5,5"
                markerEnd="url(#arrowhead)"
              />
            )
          })}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#9ca3af"
              />
            </marker>
          </defs>
        </svg>

        {/* Empty State */}
        {tables.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Designing Your Database
              </h3>
              <p className="text-gray-600 mb-4">
                Add tables from the sidebar or drag to connect them
              </p>
              <button
                onClick={() => addCommonTable('users')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                Add Your First Table
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}