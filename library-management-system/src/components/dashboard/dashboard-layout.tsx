'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { PlusCircle, X, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Unique ID generator for widgets
const generateId = () => `widget_${Math.random().toString(36).substr(2, 9)}`;

// Define base widget types
export interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  collapsed?: boolean;
  position?: number;
  userRole?: string[];
  customizable?: boolean;
}

// Available widget types for adding new widgets
export const availableWidgets = [
  { 
    type: 'books-checked-out', 
    title: 'Books Checked Out Today', 
    size: 'small',
    userRole: ['ADMIN', 'LIBRARIAN']
  },
  { 
    type: 'overdue-books', 
    title: 'Overdue Books', 
    size: 'medium',
    userRole: ['ADMIN', 'LIBRARIAN'] 
  },
  { 
    type: 'active-members', 
    title: 'Active Members', 
    size: 'small',
    userRole: ['ADMIN', 'LIBRARIAN'] 
  },
  { 
    type: 'popular-books', 
    title: 'Popular Books', 
    size: 'medium',
    userRole: ['ADMIN', 'LIBRARIAN', 'MEMBER'] 
  },
  { 
    type: 'activity-feed', 
    title: 'Recent Activity', 
    size: 'large',
    userRole: ['ADMIN', 'LIBRARIAN'] 
  },
  { 
    type: 'quick-actions', 
    title: 'Quick Actions', 
    size: 'medium',
    userRole: ['ADMIN', 'LIBRARIAN', 'MEMBER']
  },
  { 
    type: 'my-books', 
    title: 'My Books', 
    size: 'medium',
    userRole: ['MEMBER'] 
  },
  { 
    type: 'due-dates', 
    title: 'Upcoming Due Dates', 
    size: 'medium',
    userRole: ['MEMBER'] 
  }
];

interface DashboardLayoutProps {
  defaultLayout?: Widget[];
  userRole: string;
  widgets: Record<string, React.ComponentType<{ widget: Widget }>>;
}

export function DashboardLayout({ 
  defaultLayout = [], 
  userRole = 'MEMBER',
  widgets 
}: DashboardLayoutProps) {
  const { data: session } = useSession();
  const storageKey = `dashboard-layout-${session?.user?.id || 'default'}`;
  
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [dashboardWidgets, setDashboardWidgets] = useLocalStorage<Widget[]>(
    storageKey,
    filterWidgetsByRole(defaultLayout, userRole)
  );

  // Filter widgets based on user role when role changes
  useEffect(() => {
    if (dashboardWidgets.length === 0) {
      setDashboardWidgets(filterWidgetsByRole(defaultLayout, userRole));
    }
  }, [userRole, defaultLayout, setDashboardWidgets, dashboardWidgets]);

  // Filter widgets for specific user roles
  function filterWidgetsByRole(widgets: Widget[], role: string): Widget[] {
    return widgets.filter(widget => {
      if (!widget.userRole) return true;
      return widget.userRole.includes(role);
    });
  }

  // Handle widget reordering with drag and drop
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(dashboardWidgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update positions
    const itemsWithPosition = items.map((item, index) => ({
      ...item,
      position: index
    }));
    
    setDashboardWidgets(itemsWithPosition);
  };

  // Toggle widget collapse state
  const toggleWidgetCollapse = (id: string) => {
    setDashboardWidgets(
      dashboardWidgets.map((widget) =>
        widget.id === id ? { ...widget, collapsed: !widget.collapsed } : widget
      )
    );
  };

  // Remove widget from dashboard
  const removeWidget = (id: string) => {
    setDashboardWidgets(dashboardWidgets.filter((widget) => widget.id !== id));
  };

  // Add a new widget to dashboard
  const addWidget = (widgetType: string) => {
    const widgetTemplate = availableWidgets.find((w) => w.type === widgetType);
    if (!widgetTemplate) return;
    
    const newWidget: Widget = {
      id: generateId(),
      type: widgetTemplate.type,
      title: widgetTemplate.title,
      size: widgetTemplate.size as 'small' | 'medium' | 'large',
      position: dashboardWidgets.length,
      userRole: widgetTemplate.userRole,
      collapsed: false,
      customizable: true
    };
    
    setDashboardWidgets([...dashboardWidgets, newWidget]);
  };

  // Get CSS class for widget size
  const getWidgetSizeClass = (size: Widget['size']) => {
    switch (size) {
      case 'small':
        return 'col-span-1';
      case 'medium':
        return 'col-span-2';
      case 'large':
        return 'col-span-4';
      default:
        return 'col-span-2';
    }
  };

  // Get a filtered list of available widgets that can be added
  const getAvailableWidgetsForRole = () => {
    const currentWidgetTypes = dashboardWidgets.map(w => w.type);
    return availableWidgets.filter(
      w => !currentWidgetTypes.includes(w.type) && w.userRole?.includes(userRole)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="mr-2 h-4 w-4" />
                Customize Dashboard
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Customize Your Dashboard</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Current Widgets</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {dashboardWidgets.map((widget, index) => (
                      <div 
                        key={widget.id} 
                        className="flex items-center justify-between p-2 border rounded-md"
                      >
                        <span>{widget.title}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeWidget(widget.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-2">Add Widgets</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {getAvailableWidgetsForRole().map((widget) => (
                      <Button 
                        key={widget.type} 
                        variant="outline" 
                        className="justify-start"
                        onClick={() => addWidget(widget.type)}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {widget.title}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-widgets" direction="vertical">
          {(provided) => (
            <div
              className="grid grid-cols-4 gap-4"
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              {dashboardWidgets.map((widget, index) => {
                const WidgetComponent = widgets[widget.type];
                
                return (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${getWidgetSizeClass(widget.size)}`}
                      >
                        <Card>
                          <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-sm font-medium">
                              {widget.title}
                            </CardTitle>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => toggleWidgetCollapse(widget.id)}
                              >
                                {widget.collapsed ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronUp className="h-4 w-4" />
                                )}
                              </Button>
                              {widget.customizable && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => removeWidget(widget.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              <div {...provided.dragHandleProps} className="cursor-move h-7 w-7 flex items-center justify-center">
                                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M6 2.5C6 3.32843 5.32843 4 4.5 4C3.67157 4 3 3.32843 3 2.5C3 1.67157 3.67157 1 4.5 1C5.32843 1 6 1.67157 6 2.5Z" fill="currentColor"/>
                                  <path d="M6 8C6 8.82843 5.32843 9.5 4.5 9.5C3.67157 9.5 3 8.82843 3 8C3 7.17157 3.67157 6.5 4.5 6.5C5.32843 6.5 6 7.17157 6 8Z" fill="currentColor"/>
                                  <path d="M6 13.5C6 14.3284 5.32843 15 4.5 15C3.67157 15 3 14.3284 3 13.5C3 12.6716 3.67157 12 4.5 12C5.32843 12 6 12.6716 6 13.5Z" fill="currentColor"/>
                                  <path d="M13 2.5C13 3.32843 12.3284 4 11.5 4C10.6716 4 10 3.32843 10 2.5C10 1.67157 10.6716 1 11.5 1C12.3284 1 13 1.67157 13 2.5Z" fill="currentColor"/>
                                  <path d="M13 8C13 8.82843 12.3284 9.5 11.5 9.5C10.6716 9.5 10 8.82843 10 8C10 7.17157 10.6716 6.5 11.5 6.5C12.3284 6.5 13 7.17157 13 8Z" fill="currentColor"/>
                                  <path d="M13 13.5C13 14.3284 12.3284 15 11.5 15C10.6716 15 10 14.3284 10 13.5C10 12.6716 10.6716 12 11.5 12C12.3284 12 13 12.6716 13 13.5Z" fill="currentColor"/>
                                </svg>
                              </div>
                            </div>
                          </CardHeader>
                          {!widget.collapsed && (
                            <CardContent className={widget.size === 'small' ? 'p-4' : 'p-5'}>
                              {WidgetComponent ? (
                                <WidgetComponent widget={widget} />
                              ) : (
                                <div className="flex items-center justify-center h-[150px] border border-dashed rounded-lg">
                                  <p className="text-sm text-muted-foreground">
                                    Widget not found
                                  </p>
                                </div>
                              )}
                            </CardContent>
                          )}
                        </Card>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
