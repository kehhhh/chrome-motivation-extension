import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styled from '@emotion/styled';
import { FiCheckCircle, FiTrash2, FiPlus, FiList } from 'react-icons/fi';
import { useTheme } from '../context/ThemeContext';

const TodoContainer = styled(motion.div)`
    grid-area: todo;
    background: ${props => props.theme.colors.surface};
    padding: 2.5rem;
    border-radius: 1.5rem;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid ${props => props.theme.colors.border};
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    }
`;

const TodoHeader = styled(motion.div)`
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    color: ${props => props.theme.colors.text};
    position: relative;

    &::after {
        content: '';
        position: absolute;
        bottom: -0.75rem;
        left: 0;
        width: 50px;
        height: 3px;
        background: ${props => props.theme.colors.accent};
        border-radius: 2px;
    }
`;

const TodoTitle = styled(motion.h3)`
    font-size: 1.2rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
`;

const TodoIcon = styled(motion(FiList))`
    color: ${props => props.theme.colors.accent};
    width: 28px;
    height: 28px;
`;

const TodoInputContainer = styled(motion.div)`
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
`;

const TodoInput = styled(motion.input)`
    flex: 1;
    padding: 1rem 1.5rem;
    border: none;
    border-radius: 1rem;
    background: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.text};
    font-size: 1rem;
    transition: all 0.3s ease;

    &::placeholder {
        color: ${props => props.theme.colors.text};
        opacity: 0.5;
    }

    &:focus {
        outline: none;
        background: ${props => props.theme.colors.primary};
        box-shadow: 0 0 0 2px ${props => props.theme.colors.accent};
    }
`;

const AddButton = styled(motion.button)`
    padding: 1rem;
    border: none;
    border-radius: 1rem;
    background: ${props => props.theme.colors.accent};
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px ${props => `${props.theme.colors.accent}50`};
    }
`;

const TodoList = styled(motion.ul)`
    list-style: none;
    margin-top: 2rem;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 0.5rem;

    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: ${props => props.theme.colors.border};
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: ${props => props.theme.colors.accent};
        border-radius: 3px;
    }
`;

const TodoItem = styled(motion.li)`
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: ${props => props.theme.colors.border};
    border-radius: 1rem;
    margin-bottom: 0.75rem;
    color: ${props => props.theme.colors.text};
    transition: all 0.3s ease;

    &:hover {
        transform: translateX(5px);
        background: ${props => `${props.theme.colors.border}dd`};
    }

    &.completed {
        opacity: 0.7;
        text-decoration: line-through;
        background: ${props => `${props.theme.colors.border}80`};
    }
`;

const ActionButton = styled(motion.button)`
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.colors.text};
    opacity: 0.7;
    transition: all 0.3s ease;

    &:hover {
        opacity: 1;
        background: ${props => `${props.theme.colors.border}dd`};
    }
`;

const todoVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

const listVariants = {
    initial: { opacity: 1 },
    animate: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const iconVariants = {
    initial: { rotate: -90 },
    animate: { rotate: 0 },
    hover: { rotate: 15, scale: 1.1 }
};

export default function TodoSection({ todos, setTodos }) {
    const { theme } = useTheme();
    const [newTodo, setNewTodo] = useState('');

    const addTodo = () => {
        if (!newTodo.trim()) return;

        const todo = {
            id: Date.now().toString(),
            text: newTodo.trim(),
            completed: false
        };

        const updatedTodos = [...todos, todo];
        setTodos(updatedTodos);
        chrome.storage.sync.set({ todos: updatedTodos });
        setNewTodo('');
    };

    const toggleTodo = (id) => {
        const updatedTodos = todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        );
        setTodos(updatedTodos);
        chrome.storage.sync.set({ todos: updatedTodos });
    };

    const deleteTodo = (id) => {
        const updatedTodos = todos.filter(todo => todo.id !== id);
        setTodos(updatedTodos);
        chrome.storage.sync.set({ todos: updatedTodos });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    };

    return (
        <TodoContainer
            theme={theme}
            variants={todoVariants}
            initial="initial"
            animate="animate"
            exit="exit"
        >
            <TodoHeader theme={theme}>
                <TodoIcon
                    theme={theme}
                    variants={iconVariants}
                    initial="initial"
                    animate="animate"
                    whileHover="hover"
                />
                <TodoTitle
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    TODAY'S TASKS
                </TodoTitle>
            </TodoHeader>

            <TodoInputContainer>
                <TodoInput
                    theme={theme}
                    type="text"
                    placeholder="Add a new task"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyPress={handleKeyPress}
                    whileFocus={{ scale: 1.02 }}
                />
                <AddButton
                    theme={theme}
                    onClick={addTodo}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <FiPlus size={24} />
                </AddButton>
            </TodoInputContainer>

            <TodoList theme={theme} variants={listVariants}>
                <AnimatePresence>
                    {todos.map(todo => (
                        <TodoItem
                            key={todo.id}
                            theme={theme}
                            variants={todoVariants}
                            className={todo.completed ? 'completed' : ''}
                            whileHover={{ scale: 1.02 }}
                        >
                            <ActionButton
                                theme={theme}
                                onClick={() => toggleTodo(todo.id)}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <FiCheckCircle
                                    size={20}
                                    color={todo.completed ? theme.colors.accent : undefined}
                                />
                            </ActionButton>

                            <span style={{ flex: 1 }}>{todo.text}</span>

                            <ActionButton
                                theme={theme}
                                onClick={() => deleteTodo(todo.id)}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <FiTrash2 size={20} />
                            </ActionButton>
                        </TodoItem>
                    ))}
                </AnimatePresence>
            </TodoList>
        </TodoContainer>
    );
} 