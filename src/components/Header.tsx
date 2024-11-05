import React, { useMemo } from 'react';
import { 
  Box, Flex, Heading, IconButton, useColorModeValue,
  Popover, PopoverTrigger, PopoverContent, PopoverBody,
  Text, VStack, Badge, CloseButton
} from '@chakra-ui/react';
import { BellIcon } from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const Header: React.FC = () => {
  const location = useLocation();
  const { notifications, removeNotification } = useNotifications();
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  
  const getPageTitle = () => {
    const path = location.pathname.split('/')[1];
    if (!path) return 'Dashboard';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const uniqueNotifications = useMemo(() => {
    const seen = new Set();
    return notifications.filter(notification => {
      const duplicate = seen.has(notification.id);
      seen.add(notification.id);
      return !duplicate;
    });
  }, [notifications]);

  return (
    <Box 
      as="header"
      bg="gray.50" 
      borderBottom="1px" 
      borderColor={borderColor}
      h="16"
      px="6"
    >
      <Flex h="full" align="center" justify="space-between">
        <Heading size="lg" fontWeight="semibold" color="gray.800">
          {getPageTitle()}
        </Heading>
        
        <Popover placement="bottom-end">
          <PopoverTrigger>
            <Box position="relative">
              <IconButton
                aria-label="Notifications"
                icon={<BellIcon className="h-6 w-6" />}
                variant="ghost"
                colorScheme="gray"
                borderRadius="full"
              />
              {uniqueNotifications.length > 0 && (
                <Badge
                  position="absolute"
                  top="-1"
                  right="-1"
                  colorScheme="red"
                  borderRadius="full"
                  minW="5"
                  textAlign="center"
                >
                  {uniqueNotifications.length}
                </Badge>
              )}
            </Box>
          </PopoverTrigger>
          <PopoverContent width="300px">
            <PopoverBody p={4}>
              {uniqueNotifications.length === 0 ? (
                <Text color="gray.500" textAlign="center">No notifications</Text>
              ) : (
                <VStack spacing={3} align="stretch">
                  {uniqueNotifications.map(notification => (
                    <Box
                      key={notification.id}
                      p={3}
                      bg={bgColor}
                      borderRadius="md"
                      position="relative"
                    >
                      <CloseButton
                        size="sm"
                        position="absolute"
                        right="2"
                        top="2"
                        onClick={() => removeNotification(notification.id)}
                      />
                      <Text fontWeight="bold" fontSize="sm" mb={1}>
                        {notification.title}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        {notification.message}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Flex>
    </Box>
  );
};

export default Header;