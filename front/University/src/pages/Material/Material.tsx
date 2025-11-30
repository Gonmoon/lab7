import React, { useState } from 'react';
import {
    Box,
    Container,
    Typography,
    Card,
    CardContent,
    Stepper,
    Step,
    StepLabel,
    Button,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    LinearProgress,
    Chip,
    useTheme,
    useMediaQuery,
} from '@mui/material';

import Modal from '@shared/components/Modal';

interface TestQuestion {
    question: string;
    options: string[];
}

const Material: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState<bool>(false);
    const [activeStep, setActiveStep] = useState<number>(0);
    const [answers, setAnswers] = useState<Record<number, string>>({});

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const testQuestions: TestQuestion[] = [
        {
            question: 'Какой язык программирования вы предпочитаете?',
            options: ['JavaScript', 'Python', 'Java', 'C++'],
        },
        {
            question: 'Какой фреймворк вам нравится больше?',
            options: ['React', 'Vue', 'Angular', 'Svelte'],
        },
        {
            question: 'Какой уровень сложности вас интересует?',
            options: ['Начинающий', 'Средний', 'Продвинутый', 'Эксперт'],
        },
    ];

    const handleAnswer = (event: React.ChangeEvent<HTMLInputElement>): void => {
        setAnswers({
            ...answers,
            [activeStep]: event.target.value,
        });
    };

    const handleNext = (): void => {
        setActiveStep((prevStep) => prevStep + 1);
    };

    const handleBack = (): void => {
        setActiveStep((prevStep) => prevStep - 1);
    };

    const handleSubmit = (): void => {
        setIsModalOpen(true);
    };

    const progress: number = ((activeStep + 1) / testQuestions.length) * 100;
    const isLastStep: boolean = activeStep === testQuestions.length - 1;
    return (
        <>
            <Container
                maxWidth={false}
                disableGutters
                sx={{
                    minHeight: '100vh',
                    py: 4,
                    background: 'linear-gradient(#99998f 80%, #1b1612 100%)',
                }}
            >
                <Card
                    sx={{
                        background: 'linear-gradient(135deg, #db5c01 0%, #99998f 100%)',
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(27, 22, 18, 0.3)',
                        border: '1px solid #cbb796',
                    }}
                >
                    <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                        {/* Заголовок */}
                        <Box sx={{ textAlign: 'center', mb: 4 }}>
                            <Typography
                                variant="h4"
                                component="h1"
                                sx={{
                                    color: '#f8a73f',
                                    fontWeight: 'bold',
                                    mb: 1,
                                    fontSize: { xs: '1.75rem', md: '2.125rem' },
                                }}
                            >
                                Тестирование знаний
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#cbb796' }}>
                                Проверьте свои навыки и получите рекомендации
                            </Typography>
                        </Box>

                        {/* Прогресс и шаги */}
                        <Box sx={{ mb: 4 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    mb: 2,
                                }}
                            >
                                <Chip
                                    label={`Вопрос ${activeStep + 1} из ${testQuestions.length}`}
                                    sx={{
                                        backgroundColor: '#db5c01',
                                        color: 'white',
                                        fontWeight: 'bold',
                                    }}
                                />
                                <Typography variant="body2" sx={{ color: '#cbb796' }}>
                                    {Math.round(progress)}% завершено
                                </Typography>
                            </Box>

                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor: '#99998f',
                                    '& .MuiLinearProgress-bar': {
                                        backgroundColor: '#f8a73f',
                                    },
                                }}
                            />
                        </Box>

                        {/* Stepper */}
                        {!isMobile && (
                            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                                {testQuestions.map((_, index) => (
                                    <Step key={index}>
                                        <StepLabel
                                            sx={{
                                                '& .MuiStepIcon-root': {
                                                    color: '#99998f',
                                                    '&.Mui-active': {
                                                        color: '#f8a73f',
                                                    },
                                                    '&.Mui-completed': {
                                                        color: '#cbb796',
                                                    },
                                                },
                                                '& .MuiStepLabel-label': {
                                                    color:
                                                        index <= activeStep ? '#f8a73f' : '#99998f',
                                                    '&.Mui-completed': {
                                                        color: '#db5c01',
                                                    },
                                                },
                                            }}
                                        />
                                    </Step>
                                ))}
                            </Stepper>
                        )}

                        {/* Вопрос и варианты ответов */}
                        <Box sx={{ mb: 4 }}>
                            <Typography
                                variant="h6"
                                component="h2"
                                sx={{
                                    color: '#cbb796',
                                    mb: 3,
                                    fontSize: { xs: '1.1rem', md: '1.25rem' },
                                    lineHeight: 1.4,
                                }}
                            >
                                {testQuestions[activeStep]?.question}
                            </Typography>

                            <FormControl component="fieldset" fullWidth>
                                <RadioGroup
                                    value={answers[activeStep] || ''}
                                    onChange={handleAnswer}
                                >
                                    {testQuestions[activeStep]?.options.map((option, index) => (
                                        <Card
                                            key={index}
                                            sx={{
                                                mb: 2,
                                                border:
                                                    answers[activeStep] === option
                                                        ? '2px solid #f8a73f'
                                                        : '2px solid transparent',
                                                backgroundColor: '#1b1612',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    borderColor: '#cbb796',
                                                    transform: 'translateY(-2px)',
                                                    boxShadow:
                                                        '0 4px 12px rgba(203, 183, 150, 0.2)',
                                                },
                                            }}
                                        >
                                            <FormControlLabel
                                                value={option}
                                                control={
                                                    <Radio
                                                        sx={{
                                                            color: '#99998f',
                                                            '&.Mui-checked': {
                                                                color: '#f8a73f',
                                                            },
                                                        }}
                                                    />
                                                }
                                                label={
                                                    <Typography
                                                        sx={{
                                                            color: '#cbb796',
                                                            py: 1,
                                                            fontSize: {
                                                                xs: '0.9rem',
                                                                md: '1rem',
                                                            },
                                                        }}
                                                    >
                                                        {option}
                                                    </Typography>
                                                }
                                                sx={{
                                                    mx: 0,
                                                    px: 2,
                                                    width: '100%',
                                                    '& .MuiFormControlLabel-label': {
                                                        width: '100%',
                                                    },
                                                }}
                                            />
                                        </Card>
                                    ))}
                                </RadioGroup>
                            </FormControl>
                        </Box>

                        {/* Кнопки навигации */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: 2,
                            }}
                        >
                            <Button
                                variant="outlined"
                                onClick={handleBack}
                                disabled={activeStep === 0}
                                sx={{
                                    color: '#cbb796',
                                    borderColor: '#99998f',
                                    '&:hover': {
                                        borderColor: '#f8a73f',
                                        backgroundColor: 'rgba(248, 167, 63, 0.1)',
                                    },
                                    '&:disabled': {
                                        color: '#99998f',
                                        borderColor: '#99998f',
                                    },
                                }}
                            >
                                Назад
                            </Button>

                            <Button
                                variant="contained"
                                onClick={isLastStep ? handleSubmit : handleNext}
                                disabled={!answers[activeStep]}
                                sx={{
                                    backgroundColor: isLastStep ? '#db5c01' : '#f8a73f',
                                    color: '#1b1612',
                                    fontWeight: 'bold',
                                    '&:hover': {
                                        backgroundColor: isLastStep ? '#c55301' : '#e6962a',
                                    },
                                    '&:disabled': {
                                        backgroundColor: '#99998f',
                                        color: '#1b1612',
                                    },
                                }}
                            >
                                {isLastStep ? 'Завершить тест' : 'Далее'}
                            </Button>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Поздравляем!"
                children={
                    <>
                        <p>Вы потратили своё время</p>
                    </>
                }
            />
        </>
    );
};

export default Material;
