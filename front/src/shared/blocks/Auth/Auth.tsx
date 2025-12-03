import React, { useState } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import styles from './Auth.module.css';

interface AuthData {
  onClick?: () => void;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
}

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password' | 'change-password';

const API_BASE_URL = 'http://localhost:3000/api/auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== СХЕМЫ ВАЛИДАЦИИ ZOD =====

// Схема для расширенной регистрации (Форма 1)
const registerSchema = z.object({
  // Базовые поля
  email: z.string()
    .email('Введите корректный email')
    .min(5, 'Email слишком короткий')
    .max(100, 'Email слишком длинный'),
  password: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву')
    .regex(/[0-9]/, 'Пароль должен содержать хотя бы одну цифру'),
  confirmPassword: z.string(),
  // Личная информация
  firstName: z.string()
    .min(2, 'Имя должно содержать минимум 2 символа')
    .max(50, 'Имя слишком длинное'),
  lastName: z.string()
    .min(2, 'Фамилия должна содержать минимум 2 символа')
    .max(50, 'Фамилия слишком длинная'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Введите корректный номер телефона'),
  birthDate: z.string()
    .refine(date => !isNaN(Date.parse(date)), 'Введите корректную дату'),
  // Адрес
  country: z.string().min(1, 'Выберите страну'),
  city: z.string().min(2, 'Введите город'),
  address: z.string().min(5, 'Введите адрес'),
  postalCode: z.string().regex(/^\d{5,6}$/, 'Введите корректный почтовый индекс'),
  // Дополнительно
  avatar: z.instanceof(FileList)
    .optional()
    .refine(files => !files || files.length === 0 || files[0].size <= 5 * 1024 * 1024, 'Максимальный размер файла 5MB')
    .refine(files => !files || files.length === 0 || ['image/jpeg', 'image/png', 'image/gif'].includes(files[0].type), 
      'Поддерживаются только JPG, PNG и GIF'),
  interests: z.array(z.string())
    .min(1, 'Выберите хотя бы один интерес')
    .max(5, 'Не более 5 интересов'),
  subscribeNewsletter: z.boolean().default(true),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: 'Необходимо принять условия',
  }),
  // Динамические поля для образования
  education: z.array(z.object({
    institution: z.string().min(2, 'Введите название учебного заведения'),
    degree: z.string().min(1, 'Выберите степень'),
    year: z.number()
      .min(1900, 'Год должен быть не ранее 1900')
      .max(new Date().getFullYear(), 'Год не может быть в будущем'),
  })).optional(),
  // Зависимое поле: если workExperience = true, то required
  workExperience: z.boolean().default(false),
  experienceYears: z.number().min(0).max(50).optional(),
  // Асинхронная валидация email
  emailConfirmed: z.boolean().default(false),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmPassword'],
}).refine(data => {
  // Зависимая валидация: если workExperience = true, то experienceYears обязателен
  if (data.workExperience) {
    return data.experienceYears !== undefined && data.experienceYears > 0;
  }
  return true;
}, {
  message: 'Укажите количество лет опыта',
  path: ['experienceYears'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Схема для мультишаговой формы смены настроек (Форма 2)
const settingsStep1Schema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword: z.string()
    .min(8, 'Пароль должен содержать минимум 8 символов')
    .regex(/[A-Z]/, 'Пароль должен содержать хотя бы одну заглавную букву'),
  confirmNewPassword: z.string(),
  notificationEmail: z.string()
    .email('Введите корректный email')
    .optional(),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'Пароли не совпадают',
  path: ['confirmNewPassword'],
});

const settingsStep2Schema = z.object({
  theme: z.enum(['light', 'dark', 'auto']),
  language: z.enum(['ru', 'en', 'es']),
  timezone: z.string().min(1, 'Выберите часовой пояс'),
  dateFormat: z.enum(['dd.mm.yyyy', 'mm/dd/yyyy', 'yyyy-mm-dd']),
  currency: z.enum(['RUB', 'USD', 'EUR']),
  // Сложные типы: мультиселект для категорий
  favoriteCategories: z.array(z.string())
    .min(1, 'Выберите хотя бы одну категорию')
    .max(5, 'Не более 5 категорий'),
  // Загрузка документов
  documents: z.array(z.instanceof(File))
    .max(3, 'Не более 3 файлов')
    .refine(
      files => files.every(file => file.size <= 10 * 1024 * 1024),
      'Каждый файл не должен превышать 10MB'
    )
    .optional(),
});

const settingsStep3Schema = z.object({
  twoFactorAuth: z.boolean().default(false),
  backupEmail: z.string()
    .email('Введите корректный email')
    .optional(),
  securityQuestion: z.string().min(5, 'Вопрос должен содержать минимум 5 символов'),
  securityAnswer: z.string().min(2, 'Ответ должен содержать минимум 2 символа'),
  autoLogout: z.number()
    .min(5, 'Минимум 5 минут')
    .max(240, 'Максимум 240 минут'),
  // Асинхронная проверка безопасности пароля
  passwordStrength: z.number().min(0).max(100),
});

type SettingsStep1Data = z.infer<typeof settingsStep1Schema>;
type SettingsStep2Data = z.infer<typeof settingsStep2Schema>;
type SettingsStep3Data = z.infer<typeof settingsStep3Schema>;

// ===== КОМПОНЕНТ РАСШИРЕННОЙ РЕГИСТРАЦИИ =====
const EnhancedRegisterForm: React.FC<{
  onSwitchToLogin: () => void;
  onSuccess: () => void;
}> = ({ onSwitchToLogin, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    setValue,
    setError,
    formState: { errors, isValid, isDirty },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      birthDate: '',
      country: '',
      city: '',
      address: '',
      postalCode: '',
      interests: [],
      subscribeNewsletter: true,
      acceptTerms: false,
      education: [],
      workExperience: false,
      emailConfirmed: false,
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'education',
  });

  const [educationFields, setEducationFields] = useState([{ id: '1', institution: '', degree: '', year: new Date().getFullYear() }]);

  // Следим за зависимыми полями
  const workExperience = watch('workExperience');
  const email = watch('email');

  // Асинхронная проверка email на сервере
  const checkEmailAvailability = async () => {
    if (!email || errors.email) return;
    
    try {
      const response = await api.post<ApiResponse>('/check-email', { email });
      setEmailAvailable(response.data.success);
      
      if (!response.data.success) {
        setError('email', {
          type: 'manual',
          message: 'Этот email уже используется',
        });
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  // Обработчик загрузки аватарки
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Создаем FileList для валидации
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      setValue('avatar', dataTransfer.files, { shouldValidate: true });
    }
  };

  // Добавление интереса
  const addInterest = (interest: string) => {
    const currentInterests = watch('interests') || [];
    if (interest && !currentInterests.includes(interest)) {
      setValue('interests', [...currentInterests, interest], { shouldValidate: true });
    }
  };

  // Удаление интереса
  const removeInterest = (interestToRemove: string) => {
    const currentInterests = watch('interests') || [];
    setValue(
      'interests',
      currentInterests.filter(interest => interest !== interestToRemove),
      { shouldValidate: true }
    );
  };

  // Добавление образования
  const addEducation = () => {
    append({ institution: '', degree: '', year: new Date().getFullYear() });
  };

  // Замените функцию onSubmit в EnhancedRegisterForm:
const onSubmit = async (data: RegisterFormData) => {
  setIsSubmitting(true);
  setServerError('');

  try {
    // Преобразуем FormData в обычный объект для отладки
    const payload = {
      email: data.email,
      password: data.password,
      confirmPassword: data.confirmPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      birthDate: data.birthDate,
      country: data.country,
      city: data.city,
      address: data.address,
      postalCode: data.postalCode,
      subscribeNewsletter: data.subscribeNewsletter,
      acceptTerms: data.acceptTerms,
      workExperience: data.workExperience,
      experienceYears: data.experienceYears,
      emailConfirmed: data.emailConfirmed,
      interests: data.interests,
      education: data.education || [],
      avatar: data.avatar?.[0] || null,
    };

    console.log('Отправляемые данные:', payload);

    // Отправляем как JSON, а не FormData
    const response = await api.post<ApiResponse>('/register', payload);

    if (response.data.success) {
      alert('Регистрация выполнена успешно! Проверьте email для подтверждения.');
      reset();
      onSuccess();
    } else {
      throw new Error(response.data.message || 'Ошибка регистрации');
    }
  } catch (err: any) {
    console.error('Registration error:', err);
    setServerError(err.response?.data?.message || err.message || 'Произошла ошибка при регистрации');
  } finally {
    setIsSubmitting(false);
  }
};

  // Список стран для автозаполнения
  const countries = ['Россия', 'США', 'Германия', 'Франция', 'Китай', 'Япония'];
  const interestsList = ['Технологии', 'Спорт', 'Искусство', 'Наука', 'Музыка', 'Кино', 'Путешествия'];
  const degreeOptions = ['Бакалавр', 'Магистр', 'Доктор', 'Специалист'];

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Расширенная регистрация</h2>
      
      {serverError && (
        <div className={styles.errorMessage}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
        {/* Личная информация */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Личная информация</h3>
          
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Имя *
                <input
                  type="text"
                  {...register('firstName')}
                  className={styles.input}
                  placeholder="Введите имя"
                />
              </label>
              {errors.firstName && (
                <span className={styles.error}>{errors.firstName.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Фамилия *
                <input
                  type="text"
                  {...register('lastName')}
                  className={styles.input}
                  placeholder="Введите фамилию"
                />
              </label>
              {errors.lastName && (
                <span className={styles.error}>{errors.lastName.message}</span>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Email *
                <div className={styles.emailContainer}>
                  <input
                    type="email"
                    {...register('email')}
                    className={styles.input}
                    placeholder="email@example.com"
                    onBlur={checkEmailAvailability}
                  />
                  {emailAvailable === true && (
                    <span className={styles.successBadge}>✓ Доступен</span>
                  )}
                  {emailAvailable === false && (
                    <span className={styles.errorBadge}>✗ Занят</span>
                  )}
                </div>
              </label>
              {errors.email && (
                <span className={styles.error}>{errors.email.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Дата рождения *
                <input
                  type="date"
                  {...register('birthDate')}
                  className={styles.input}
                  max={new Date().toISOString().split('T')[0]}
                />
              </label>
              {errors.birthDate && (
                <span className={styles.error}>{errors.birthDate.message}</span>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Телефон *
                <input
                  type="tel"
                  {...register('phone')}
                  className={styles.input}
                  placeholder="+79991234567"
                />
              </label>
              {errors.phone && (
                <span className={styles.error}>{errors.phone.message}</span>
              )}
            </div>
          </div>
        </div>

        {/* Адрес */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Адрес</h3>
          
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Страна *
                <Controller
                  control={control}
                  name="country"
                  render={({ field }) => (
                    <>
                      <input
                        list="countries"
                        {...field}
                        className={styles.input}
                        placeholder="Начните вводить страну..."
                      />
                      <datalist id="countries">
                        {countries.map(country => (
                          <option key={country} value={country} />
                        ))}
                      </datalist>
                    </>
                  )}
                />
              </label>
              {errors.country && (
                <span className={styles.error}>{errors.country.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Город *
                <input
                  type="text"
                  {...register('city')}
                  className={styles.input}
                  placeholder="Введите город"
                />
              </label>
              {errors.city && (
                <span className={styles.error}>{errors.city.message}</span>
              )}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Адрес *
              <input
                type="text"
                {...register('address')}
                className={styles.input}
                placeholder="Улица, дом, квартира"
              />
            </label>
            {errors.address && (
              <span className={styles.error}>{errors.address.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Почтовый индекс *
              <input
                type="text"
                {...register('postalCode')}
                className={styles.input}
                placeholder="123456"
                pattern="\d{5,6}"
              />
            </label>
            {errors.postalCode && (
              <span className={styles.error}>{errors.postalCode.message}</span>
            )}
          </div>
        </div>

        {/* Безопасность */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Безопасность</h3>
          
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Пароль *
                <input
                  type="password"
                  {...register('password')}
                  className={styles.input}
                  placeholder="Минимум 8 символов"
                />
              </label>
              {errors.password && (
                <span className={styles.error}>{errors.password.message}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Подтвердите пароль *
                <input
                  type="password"
                  {...register('confirmPassword')}
                  className={styles.input}
                  placeholder="Повторите пароль"
                />
              </label>
              {errors.confirmPassword && (
                <span className={styles.error}>{errors.confirmPassword.message}</span>
              )}
            </div>
          </div>
        </div>

        {/* Дополнительно */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Дополнительно</h3>
          
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Аватар
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className={styles.fileInput}
              />
            </label>
            {errors.avatar && (
              <span className={styles.error}>{errors.avatar.message}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Интересы *
              <div className={styles.interestsContainer}>
                <div className={styles.interestsList}>
                  {interestsList.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => {
                        const current = watch('interests') || [];
                        if (current.includes(interest)) {
                          removeInterest(interest);
                        } else {
                          addInterest(interest);
                        }
                      }}
                      className={`${styles.interestButton} ${
                        (watch('interests') || []).includes(interest) ? styles.selected : ''
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
                <div className={styles.selectedInterests}>
                  {(watch('interests') || []).map(interest => (
                    <span key={interest} className={styles.selectedInterest}>
                      {interest}
                      <button
                        type="button"
                        onClick={() => removeInterest(interest)}
                        className={styles.removeInterest}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </label>
            {errors.interests && (
              <span className={styles.error}>{errors.interests.message}</span>
            )}
          </div>

          {/* Динамические поля для образования */}
          <div className={styles.formGroup}>
            <label className={styles.label}>
              Образование
            </label>
            {fields.map((field, index) => (
              <div key={field.id} className={styles.educationRow}>
                <input
                  {...register(`education.${index}.institution`)}
                  className={styles.input}
                  placeholder="Учебное заведение"
                />
                <select
                  {...register(`education.${index}.degree`)}
                  className={styles.select}
                >
                  <option value="">Степень</option>
                  {degreeOptions.map(degree => (
                    <option key={degree} value={degree}>{degree}</option>
                  ))}
                </select>
                <input
                  type="number"
                  {...register(`education.${index}.year`, { valueAsNumber: true })}
                  className={styles.input}
                  placeholder="Год"
                  min="1900"
                  max={new Date().getFullYear()}
                />
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className={styles.removeButton}
                >
                  Удалить
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addEducation}
              className={styles.addButton}
            >
              + Добавить образование
            </button>
          </div>

          {/* Зависимые поля: опыт работы */}
          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                {...register('workExperience')}
              />
              <span>Имею опыт работы</span>
            </label>
            
            {workExperience && (
              <div className={styles.dependentField}>
                <label className={styles.label}>
                  Лет опыта *
                  <input
                    type="number"
                    {...register('experienceYears', { valueAsNumber: true })}
                    className={styles.input}
                    min="1"
                    max="50"
                    placeholder="Введите количество лет"
                  />
                </label>
                {errors.experienceYears && (
                  <span className={styles.error}>{errors.experienceYears.message}</span>
                )}
              </div>
            )}
          </div>

          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                {...register('subscribeNewsletter')}
              />
              <span>Подписаться на новостную рассылку</span>
            </label>

            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                {...register('acceptTerms')}
              />
              <span>Я принимаю условия пользовательского соглашения *</span>
            </label>
            {errors.acceptTerms && (
              <span className={styles.error}>{errors.acceptTerms.message}</span>
            )}
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className={styles.secondaryButton}
          >
            ← Назад к входу
          </button>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={!isValid || isSubmitting}
          >
            {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ===== КОМПОНЕНТ МУЛЬТИШАГОВЫХ НАСТРОЕК =====
const SettingsWizardForm: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const step1Form = useForm<SettingsStep1Data>({
    resolver: zodResolver(settingsStep1Schema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
      notificationEmail: '',
    },
    mode: 'onChange',
  });

  const step2Form = useForm<SettingsStep2Data>({
    resolver: zodResolver(settingsStep2Schema),
    defaultValues: {
      theme: 'auto',
      language: 'ru',
      timezone: 'Europe/Moscow',
      dateFormat: 'dd.mm.yyyy',
      currency: 'RUB',
      favoriteCategories: [],
      documents: [],
    },
    mode: 'onChange',
  });

  const step3Form = useForm<SettingsStep3Data>({
    resolver: zodResolver(settingsStep3Schema),
    defaultValues: {
      twoFactorAuth: false,
      backupEmail: '',
      securityQuestion: '',
      securityAnswer: '',
      autoLogout: 30,
      passwordStrength: 0,
    },
    mode: 'onChange',
  });

  const handleNextStep = async () => {
    let isValid = false;
    
    if (step === 1) {
      isValid = await step1Form.trigger();
    } else if (step === 2) {
      isValid = await step2Form.trigger();
    }
    
    if (isValid) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    step2Form.setValue('documents', files, { shouldValidate: true });
  };

  const handleCategoryToggle = (category: string) => {
    const current = step2Form.getValues('favoriteCategories') || [];
    const newCategories = current.includes(category)
      ? current.filter(c => c !== category)
      : [...current, category];
    step2Form.setValue('favoriteCategories', newCategories, { shouldValidate: true });
  };

  // Асинхронная проверка сложности пароля
  const checkPasswordStrength = async (password: string) => {
    if (!password) return;
    
    // Имитация запроса на сервер
    const strength = Math.min(100, password.length * 10);
    step3Form.setValue('passwordStrength', strength);
  };

  const onSubmit = async () => {
    setIsSubmitting(true);
    
    const step1Data = step1Form.getValues();
    const step2Data = step2Form.getValues();
    const step3Data = step3Form.getValues();

    try {
      // Имитация сохранения настроек
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Настройки успешно сохранены!');
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['Технологии', 'Бизнес', 'Здоровье', 'Образование', 'Развлечения', 'Спорт'];
  const timezones = ['Europe/Moscow', 'Europe/London', 'America/New_York', 'Asia/Tokyo'];

  return (
    <div className={styles.formContainer}>
      <h2 className={styles.formTitle}>Настройки профиля</h2>
      
      {/* Шаги */}
      <div className={styles.steps}>
        <div className={`${styles.step} ${step >= 1 ? styles.activeStep : ''}`}>
          <div className={styles.stepNumber}>1</div>
          <div className={styles.stepText}>Безопасность</div>
        </div>
        <div className={styles.stepDivider}></div>
        <div className={`${styles.step} ${step >= 2 ? styles.activeStep : ''}`}>
          <div className={styles.stepNumber}>2</div>
          <div className={styles.stepText}>Настройки</div>
        </div>
        <div className={styles.stepDivider}></div>
        <div className={`${styles.step} ${step >= 3 ? styles.activeStep : ''}`}>
          <div className={styles.stepNumber}>3</div>
          <div className={styles.stepText}>Безопасность</div>
        </div>
      </div>

      {/* Шаг 1: Смена пароля */}
      {step === 1 && (
        <form onSubmit={step1Form.handleSubmit(handleNextStep)} className={styles.form}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Смена пароля</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Текущий пароль *
                <input
                  type="password"
                  {...step1Form.register('currentPassword')}
                  className={styles.input}
                  placeholder="Введите текущий пароль"
                />
              </label>
              {step1Form.formState.errors.currentPassword && (
                <span className={styles.error}>
                  {step1Form.formState.errors.currentPassword.message}
                </span>
              )}
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Новый пароль *
                  <input
                    type="password"
                    {...step1Form.register('newPassword')}
                    className={styles.input}
                    placeholder="Введите новый пароль"
                    onChange={(e) => checkPasswordStrength(e.target.value)}
                  />
                </label>
                {step1Form.formState.errors.newPassword && (
                  <span className={styles.error}>
                    {step1Form.formState.errors.newPassword.message}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Подтвердите пароль *
                  <input
                    type="password"
                    {...step1Form.register('confirmNewPassword')}
                    className={styles.input}
                    placeholder="Повторите новый пароль"
                  />
                </label>
                {step1Form.formState.errors.confirmNewPassword && (
                  <span className={styles.error}>
                    {step1Form.formState.errors.confirmNewPassword.message}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Email для уведомлений
                <input
                  type="email"
                  {...step1Form.register('notificationEmail')}
                  className={styles.input}
                  placeholder="notification@example.com"
                />
              </label>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.secondaryButton}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={!step1Form.formState.isValid}
            >
              Далее →
            </button>
          </div>
        </form>
      )}

      {/* Шаг 2: Настройки интерфейса */}
      {step === 2 && (
        <form onSubmit={step2Form.handleSubmit(handleNextStep)} className={styles.form}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Настройки интерфейса</h3>
            
            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Тема
                </label>
                <select {...step2Form.register('theme')} className={styles.select}>
                  <option value="light">Светлая</option>
                  <option value="dark">Темная</option>
                  <option value="auto">Авто</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Язык
                </label>
                <select {...step2Form.register('language')} className={styles.select}>
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Формат даты
                </label>
                <select {...step2Form.register('dateFormat')} className={styles.select}>
                  <option value="dd.mm.yyyy">31.12.2024</option>
                  <option value="mm/dd/yyyy">12/31/2024</option>
                  <option value="yyyy-mm-dd">2024-12-31</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Валюта
                </label>
                <select {...step2Form.register('currency')} className={styles.select}>
                  <option value="RUB">₽ RUB</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Часовой пояс
              </label>
              <select {...step2Form.register('timezone')} className={styles.select}>
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Любимые категории *
              </label>
              <div className={styles.categoriesContainer}>
                {categories.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryToggle(category)}
                    className={`${styles.categoryButton} ${
                      (step2Form.watch('favoriteCategories') || []).includes(category)
                        ? styles.selectedCategory
                        : ''
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              {step2Form.formState.errors.favoriteCategories && (
                <span className={styles.error}>
                  {step2Form.formState.errors.favoriteCategories.message}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Документы (макс. 3)
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className={styles.fileInput}
                accept=".pdf,.doc,.docx,.jpg,.png"
              />
              {step2Form.formState.errors.documents && (
                <span className={styles.error}>
                  {step2Form.formState.errors.documents.message}
                </span>
              )}
              <div className={styles.fileList}>
                {(step2Form.watch('documents') || []).map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handlePrevStep}
              className={styles.secondaryButton}
            >
              ← Назад
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={!step2Form.formState.isValid}
            >
              Далее →
            </button>
          </div>
        </form>
      )}

      {/* Шаг 3: Настройки безопасности */}
      {step === 3 && (
        <form onSubmit={step3Form.handleSubmit(onSubmit)} className={styles.form}>
          <div className={styles.formSection}>
            <h3 className={styles.sectionTitle}>Настройки безопасности</h3>
            
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  {...step3Form.register('twoFactorAuth')}
                />
                <span>Двухфакторная аутентификация</span>
              </label>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Резервный email
                  <input
                    type="email"
                    {...step3Form.register('backupEmail')}
                    className={styles.input}
                    placeholder="backup@example.com"
                  />
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Автовыход (минуты)
                  <input
                    type="number"
                    {...step3Form.register('autoLogout', { valueAsNumber: true })}
                    className={styles.input}
                    min="5"
                    max="240"
                  />
                </label>
                {step3Form.formState.errors.autoLogout && (
                  <span className={styles.error}>
                    {step3Form.formState.errors.autoLogout.message}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Контрольный вопрос *
                <input
                  type="text"
                  {...step3Form.register('securityQuestion')}
                  className={styles.input}
                  placeholder="Например: Девичья фамилия матери?"
                />
              </label>
              {step3Form.formState.errors.securityQuestion && (
                <span className={styles.error}>
                  {step3Form.formState.errors.securityQuestion.message}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Ответ на вопрос *
                <input
                  type="text"
                  {...step3Form.register('securityAnswer')}
                  className={styles.input}
                  placeholder="Ответ"
                />
              </label>
              {step3Form.formState.errors.securityAnswer && (
                <span className={styles.error}>
                  {step3Form.formState.errors.securityAnswer.message}
                </span>
              )}
            </div>

            {/* Индикатор сложности пароля */}
            {step3Form.watch('passwordStrength') > 0 && (
              <div className={styles.passwordStrength}>
                <label>Сложность пароля:</label>
                <div className={styles.strengthBar}>
                  <div 
                    className={styles.strengthFill}
                    style={{ width: `${step3Form.watch('passwordStrength')}%` }}
                  ></div>
                </div>
                <span className={styles.strengthText}>
                  {step3Form.watch('passwordStrength') < 30 ? 'Слабый' :
                   step3Form.watch('passwordStrength') < 70 ? 'Средний' : 'Сильный'}
                </span>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              onClick={handlePrevStep}
              className={styles.secondaryButton}
            >
              ← Назад
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSubmitting || !step3Form.formState.isValid}
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ===== ОСНОВНОЙ КОМПОНЕНТ АВТОРИЗАЦИИ =====
const Auth: React.FC<AuthData> = ({ onClick }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post<ApiResponse>('/login', {
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (response.data.success) {
        localStorage.setItem('authToken', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        alert('Вход выполнен успешно!');
        if (onClick) onClick();
      } else {
        throw new Error(response.data.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Произошла ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  const switchToRegister = () => setMode('register');
  const switchToLogin = () => setMode('login');
  const switchToSettings = () => setMode('change-password');

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    alert('Вы вышли из системы');
    setMode('login');
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        {mode === 'login' && (
          <>
            <h2 className={styles.title}>Вход в аккаунт</h2>
            
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className={styles.input}
                  placeholder="Введите ваш email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="password" className={styles.label}>
                  Пароль
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={styles.input}
                  placeholder="Введите пароль"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className={styles.rememberMe}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => setFormData({...formData, rememberMe: e.target.checked})}
                    className={styles.checkbox}
                    disabled={isLoading}
                  />
                  Запомнить меня
                </label>
              </div>

              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isLoading}
              >
                {isLoading ? 'Вход...' : 'Войти'}
              </button>
            </form>

            <div className={styles.authLinks}>
              <button 
                type="button" 
                onClick={switchToRegister}
                className={styles.linkButton}
                disabled={isLoading}
              >
                Создать аккаунт
              </button>
              <button 
                type="button" 
                onClick={switchToSettings}
                className={styles.linkButton}
                disabled={isLoading}
              >
                Настройки
              </button>
            </div>

            {localStorage.getItem('authToken') && (
              <div className={styles.logoutSection}>
                <button 
                  type="button" 
                  onClick={handleLogout}
                  className={styles.logoutButton}
                >
                  Выйти из системы
                </button>
              </div>
            )}
          </>
        )}

        {mode === 'register' && (
          <EnhancedRegisterForm 
            onSwitchToLogin={switchToLogin}
            onSuccess={switchToLogin}
          />
        )}

        {mode === 'change-password' && (
          <SettingsWizardForm 
            onClose={switchToLogin}
          />
        )}
      </div>
    </div>
  );
};

export default Auth;