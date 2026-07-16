import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  List, 
  Wind, 
  Check, 
  Building2, 
  SlidersHorizontal,
  X 
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export function OrgOverlayPage({ onClose }: { onClose: () => void }) {
  const { 
    orgs, 
    venues, 
    units, 
    selectedUnitId, 
    setSelectedUnitId,
    selectedVenueId,
    setSelectedVenueId,
    setActiveTab 
  } = useAppContext();

  // Selected Organization State
  const [selectedOrgId, setSelectedOrgId] = useState<string>(orgs[0]?.id || 'org-1');
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'faulty'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Expanded Venue State (Accordion)
  const [expandedVenueIds, setExpandedVenueIds] = useState<Record<string, boolean>>({
    'ven-1': true // Expand first venue by default for high visual parity with screenshot
  });

  // Track which venue has its device-dropdown menu open on the right
  const [openVenueDropdownId, setOpenVenueDropdownId] = useState<string | null>(null);

  // Get selected organization object
  const selectedOrg = useMemo(() => {
    return orgs.find(o => o.id === selectedOrgId) || orgs[0] || { id: 'org-1', name: 'SSUET_AS' };
  }, [orgs, selectedOrgId]);

  // Filter venues related to the selected organization
  const orgVenues = useMemo(() => {
    return venues.filter(v => v.orgId === selectedOrgId);
  }, [venues, selectedOrgId]);

  // Filter venues by search query and active filter
  const filteredVenues = useMemo(() => {
    return orgVenues.filter(venue => {
      const venueUnits = units.filter(u => u.venueId === venue.id);
      
      // Check search match
      const matchesVenueSearch = venue.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUnitSearch = venueUnits.some(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSearch = matchesVenueSearch || matchesUnitSearch || searchQuery === '';

      // Check status filters
      let matchesFilter = true;
      if (activeFilter === 'active') {
        matchesFilter = venueUnits.some(u => u.isOn);
      } else if (activeFilter === 'faulty') {
        matchesFilter = venueUnits.some(u => u.hasFault);
      }

      return matchesSearch && matchesFilter;
    });
  }, [orgVenues, searchQuery, units, activeFilter]);

  const toggleVenueExpand = (venueId: string) => {
    setExpandedVenueIds(prev => ({
      ...prev,
      [venueId]: !prev[venueId]
    }));
  };

  const handleSelectOrg = (orgId: string) => {
    setSelectedOrgId(orgId);
    setIsOrgDropdownOpen(false);
    // Reset search when changing org
    setSearchQuery('');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-none animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* MAIN NON-SCROLLABLE BOX CONTAINER */}
      <div className="flex-1 flex flex-col min-h-0 px-5 pt-4 pb-6">
        
        {/* Title & Organization Dropdown Selector */}
        <div className="mb-4 shrink-0">
          <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1">
            Organization List
          </span>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              className="flex items-center gap-2 hover:bg-slate-100 px-2 py-1.5 rounded-lg -ml-2 transition-colors duration-150 group text-left"
            >
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                {selectedOrg.name.replace('_', ' ')}
              </h1>
              {orgs.length > 1 && (
                <ChevronDown className={`w-5 h-5 text-slate-500 mt-1 transition-transform duration-200 ${isOrgDropdownOpen ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* Organizations Dropdown list */}
            {isOrgDropdownOpen && orgs.length > 1 && (
              <>
                <div 
                  className="fixed inset-0 z-30 bg-transparent" 
                  onClick={() => setIsOrgDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-40 animate-in fade-in slide-in-from-top-2 duration-150 max-h-60 overflow-y-auto">
                  <div className="px-4 py-1.5 border-b border-slate-100 mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Switch Organization</span>
                  </div>
                  {orgs.map(org => (
                    <button
                      key={org.id}
                      onClick={() => handleSelectOrg(org.id)}
                      className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-colors ${
                        selectedOrgId === org.id 
                          ? 'text-blue-600 bg-blue-50/50' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{org.name.replace('_', ' ')}</span>
                      {selectedOrgId === org.id && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filter & Search Controls row */}
        <div className="flex items-center gap-3 mb-4 shrink-0">
          
          {/* Blue Filter Button with Green Indicator */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="flex items-center gap-2 bg-blue-600 active:bg-blue-700 text-white font-black text-xs uppercase tracking-wider px-4 py-3 rounded-full shadow-md shadow-blue-600/10 active:scale-95 transition-all"
            >
              <span>Filter</span>
              <span className="w-5 h-5 rounded-full bg-[#10b981] flex items-center justify-center">
                <ChevronDown className="w-3 h-3 text-white" />
              </span>
            </button>

            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-30 bg-transparent" 
                  onClick={() => setShowFilterDropdown(false)}
                />
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-1.5 z-40 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => {
                      setActiveFilter('all');
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between hover:bg-slate-50 ${
                      activeFilter === 'all' ? 'text-blue-600' : 'text-slate-700'
                    }`}
                  >
                    <span>All Venues</span>
                    {activeFilter === 'all' && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                  <button
                    onClick={() => {
                      setActiveFilter('active');
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between hover:bg-slate-50 ${
                      activeFilter === 'active' ? 'text-blue-600' : 'text-slate-700'
                    }`}
                  >
                    <span>Active Devices</span>
                    {activeFilter === 'active' && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                  <button
                    onClick={() => {
                      setActiveFilter('faulty');
                      setShowFilterDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between hover:bg-slate-50 ${
                      activeFilter === 'faulty' ? 'text-blue-600' : 'text-slate-700'
                    }`}
                  >
                    <span>Faulty Devices</span>
                    {activeFilter === 'faulty' && <Check className="w-4 h-4 text-blue-600" />}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Search Box */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-slate-800 text-xs font-bold pl-4 pr-10 py-3 rounded-full border border-slate-200/50 focus:outline-none focus:border-blue-500 shadow-sm transition-all placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 text-blue-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* INNER SCROLLABLE LIST OF VENUES & DEVICES */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col scrollbar-thin">
          {filteredVenues.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">No Venues Found</span>
              <p className="text-xs text-slate-400 max-w-[200px]">Try adjusting your search query or filter options</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {/* All Campus Venues Row */}
              <div 
                onClick={() => {
                  setSelectedVenueId(null);
                  setSelectedUnitId(null);
                  setActiveTab('dashboard');
                  onClose();
                }}
                className="flex items-center justify-between py-4 px-5 hover:bg-slate-50/50 cursor-pointer transition-colors active:bg-slate-100/30"
              >
                <div className="flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100/30">
                    <Building2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="font-extrabold text-[#005ac1] uppercase text-[13px] tracking-wider">
                    All Campus Venues
                  </span>
                </div>
              </div>

              {filteredVenues.map((venue) => {
                const venueUnits = units.filter(u => u.venueId === venue.id);
                const isExpanded = !!expandedVenueIds[venue.id];
                
                return (
                  <div key={venue.id} className="flex flex-col">
                    
                    {/* Venue Row */}
                    <div 
                      onClick={() => {
                        setSelectedVenueId(venue.id);
                        setSelectedUnitId(null);
                        setActiveTab('dashboard');
                        onClose();
                      }}
                      className="flex items-center justify-between py-4 px-5 hover:bg-slate-50/50 cursor-pointer transition-colors active:bg-slate-100/30"
                    >
                      <div className="flex items-center gap-4">
                        {/* Down/Up chevron-circle indicator on left */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVenueExpand(venue.id);
                          }}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                            isExpanded 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-blue-50 text-blue-600 border border-blue-100/30'
                          }`}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 stroke-[3]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 stroke-[3]" />
                          )}
                        </div>
                        
                        <span className="font-bold text-[#005ac1] uppercase text-[13px] tracking-wider">
                          {venue.name.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Right-side dropdown picker for list of devices inside this venue */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setOpenVenueDropdownId(openVenueDropdownId === venue.id ? null : venue.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition-all ${
                            openVenueDropdownId === venue.id 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <List className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {openVenueDropdownId === venue.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-30 bg-transparent" 
                              onClick={() => setOpenVenueDropdownId(null)}
                            />
                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100/80 py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-150 max-h-56 overflow-y-auto scrollbar-thin">
                              <div className="px-4 py-1.5 border-b border-slate-100 mb-1.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                                  {venue.name.replace('_', ' ')} Devices
                                </span>
                              </div>
                              {venueUnits.length === 0 ? (
                                <div className="px-4 py-3 text-xs text-slate-400 italic">
                                  No devices in this venue
                                </div>
                              ) : (
                                venueUnits.map(unit => (
                                  <button
                                    key={unit.id}
                                    onClick={() => {
                                      setSelectedUnitId(unit.id);
                                      setActiveTab('dashboard');
                                      setOpenVenueDropdownId(null);
                                      onClose();
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-colors ${
                                      selectedUnitId === unit.id 
                                        ? 'bg-blue-50/50 text-blue-600' 
                                        : 'text-slate-700 hover:bg-slate-50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      <Wind className={`w-3.5 h-3.5 shrink-0 ${unit.isOn ? 'text-emerald-500 animate-pulse' : 'text-slate-300'}`} />
                                      <span className="truncate">{unit.name}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                                        unit.isOn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
                                      }`}>
                                        {unit.isOn ? 'ON' : 'OFF'}
                                      </span>
                                      {selectedUnitId === unit.id && (
                                        <Check className="w-3.5 h-3.5 text-blue-600" />
                                      )}
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Inline expanded Devices list (matches expanded SSUET BLK-AF under screenshot) */}
                    {isExpanded && (
                      <div className="bg-[#fcfdfe] pl-14 pr-5 py-1 flex flex-col divide-y divide-slate-100/50">
                        {venueUnits.length === 0 ? (
                          <div className="py-3 text-xs text-slate-400 italic">
                            No devices configured
                          </div>
                        ) : (
                          venueUnits.map((unit) => (
                            <div 
                              key={unit.id}
                              onClick={() => {
                                setSelectedUnitId(unit.id);
                                setActiveTab('dashboard');
                                onClose();
                              }}
                              className={`flex items-center justify-between py-3 cursor-pointer group active:opacity-70 transition-all ${
                                selectedUnitId === unit.id ? 'text-[#005ac1]' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Vector Air Conditioner/Wind Icon */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                                  unit.isOn ? 'bg-blue-50' : 'bg-slate-50'
                                }`}>
                                  <svg 
                                    className={`w-4 h-4 transition-transform duration-500 ${
                                      unit.isOn ? 'text-[#005ac1] rotate-12' : 'text-slate-400'
                                    }`} 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                  >
                                    <path d="M2 12h20" />
                                    <path d="M5 16s2 1 7 1 7-1 7-1" />
                                    <path d="M8 8H5a3 3 0 0 0-3 3v4" />
                                    <path d="M16 8h3a3 3 0 0 1 3 3v4" />
                                  </svg>
                                </div>
                                <span className="font-bold text-[13px] tracking-wide">
                                  {unit.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] px-2 py-0.5 rounded font-black ${
                                  unit.isOn 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {unit.isOn ? 'ON' : 'OFF'}
                                </span>
                                {selectedUnitId === unit.id && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
