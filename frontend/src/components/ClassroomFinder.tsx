import { useState } from 'react'
import { format } from 'date-fns'

interface EmptyRoom {
  building: string
  room: string
  availableFrom: string
  availableTo: string
}

const ClassroomFinder = () => {
  const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [time, setTime] = useState<string>(format(new Date(), 'HH:mm'))
  const [building, setBuilding] = useState<string>('')
  const [emptyRooms, setEmptyRooms] = useState<EmptyRoom[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'building' | 'availability'>('building')
  const [filters, setFilters] = useState({
    building: '',
    minCapacity: '',
    hasProjector: false,
  })

  const handleSearch = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({
        date,
        time,
        building,
        minCapacity: filters.minCapacity,
        hasProjector: filters.hasProjector.toString(),
        buildingFilter: filters.building
      })

      const response = await fetch(`/api/empty-rooms?${queryParams}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch empty rooms')
      }

      const data = await response.json()
      
      // Sort the results
      const sortedRooms = [...data].sort((a, b) => {
        if (sortBy === 'building') {
          return `${a.building}${a.room}`.localeCompare(`${b.building}${b.room}`)
        }
        return a.availableFrom.localeCompare(b.availableFrom)
      })

      setEmptyRooms(sortedRooms)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="space-y-4">
        {/* Existing date and time inputs */}
        
        {/* Filters */}
        <div className="border-t pt-4 mt-4">
          <h3 className="text-lg font-medium mb-2">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Building
              </label>
              <input
                type="text"
                value={filters.building}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  building: e.target.value
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Filter by building"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Capacity
              </label>
              <input
                type="number"
                value={filters.minCapacity}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  minCapacity: e.target.value
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Minimum room capacity"
              />
            </div>
            
            <div className="col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.hasProjector}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    hasProjector: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Has Projector
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Sort options */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sort by
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'building' | 'availability')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="building">Building & Room</option>
            <option value="availability">Availability Time</option>
          </select>
        </div>

        <button
          onClick={handleSearch}
          disabled={isLoading}
          className={`w-full px-4 py-2 rounded-md text-white ${
            isLoading 
              ? 'bg-indigo-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isLoading ? 'Searching...' : 'Find Empty Rooms'}
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      )}

      {/* Results */}
      {!isLoading && emptyRooms.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-medium text-gray-900">
            Available Rooms ({emptyRooms.length})
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emptyRooms.map((room, index) => (
              <div 
                key={index} 
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium">{room.building} - Room {room.room}</h3>
                <p className="text-sm text-gray-500">
                  Available: {room.availableFrom} - {room.availableTo}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && emptyRooms.length === 0 && !error && (
        <div className="mt-6 text-center text-gray-500">
          No empty rooms found for the selected criteria.
        </div>
      )}
    </div>
  )
}

export default ClassroomFinder