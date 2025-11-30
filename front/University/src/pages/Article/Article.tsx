import React, { useState, useEffect } from 'react';
import styles from './Article.module.css';
import {
  useGetPublicationsQuery,
  useCreatePublicationMutation,
  useUpdatePublicationMutation,
  useDeletePublicationMutation,
  useGetRecipientsQuery,
  useCreateRecipientMutation,
  useUpdateRecipientMutation,
  useDeleteRecipientMutation,
  useGetSubscriptionsQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
} from '../../store/slices/apiSlice';
import ApiTester from '@shared/components/ApiTester';

const Article: React.FC = () => {
  // ===== Publications =====
  const { data: pubsResponse, isLoading: pubsLoading, refetch: refetchPubs } = useGetPublicationsQuery({ page: 1, limit: 10 });
  const [createPublication] = useCreatePublicationMutation();
  const [updatePublication] = useUpdatePublicationMutation();
  const [deletePublication] = useDeletePublicationMutation();
  const publications = pubsResponse ?? [];

  // ===== Recipients =====
  const { data: recsResponse, isLoading: recsLoading, refetch: refetchRecs } = useGetRecipientsQuery({});
  const [createRecipient] = useCreateRecipientMutation();
  const [updateRecipient] = useUpdateRecipientMutation();
  const [deleteRecipient] = useDeleteRecipientMutation();
  const recipients = recsResponse ?? [];

  // ===== Subscriptions =====
  const { data: subsResponse, isLoading: subsLoading, refetch: refetchSubs } = useGetSubscriptionsQuery({});
  const [createSubscription] = useCreateSubscriptionMutation();
  const [updateSubscription] = useUpdateSubscriptionMutation();
  const [deleteSubscription] = useDeleteSubscriptionMutation();
  const subscriptions = subsResponse ?? [];

  // ===== State for forms =====
  const [newPublication, setNewPublication] = useState({ index: '', title: '', type: 'газета', monthly_cost: 0 });
  const [newRecipient, setNewRecipient] = useState({ full_name: '', street: '', house: '', apartment: '' });
  const [newSubscription, setNewSubscription] = useState({
    recipient_id: 0,
    publication_index: '',
    duration_months: 1,
    start_month: 1,
    start_year: new Date().getFullYear(),
  });

  // ===== Handlers =====
  // --- Publications ---
  const handleAddPublication = async () => {
    if (!newPublication.index || !newPublication.title || !['газета','журнал'].includes(newPublication.type) || newPublication.monthly_cost < 0) {
      alert('Заполните все поля корректно: тип "газета" или "журнал", стоимость ≥ 0');
      return;
    }
    await createPublication(newPublication).unwrap();
    setNewPublication({ index: '', title: '', type: 'газета', monthly_cost: 0 });
    refetchPubs();
  };

  const handleUpdatePublication = async (index: string) => {
    const cost = prompt('Введите новую стоимость публикации:');
    if (!cost) return;
    await updatePublication({ index, body: { monthly_cost: Number(cost) } }).unwrap();
    refetchPubs();
  };

  const handleDeletePublication = async (index: string) => {
    if (window.confirm('Вы уверены, что хотите удалить публикацию?')) {
      await deletePublication(index).unwrap();
      refetchPubs();
    }
  };

  // --- Recipients ---
  const handleAddRecipient = async () => {
    if (!newRecipient.full_name || !newRecipient.street || !newRecipient.house) {
      alert('Заполните ФИО, улицу и дом');
      return;
    }
    await createRecipient(newRecipient).unwrap();
    setNewRecipient({ full_name: '', street: '', house: '', apartment: '' });
    refetchRecs();
  };

  const handleUpdateRecipient = async (id: number) => {
    const fullName = prompt('Введите новое ФИО:');
    if (!fullName) return;
    await updateRecipient({ id, body: { full_name: fullName } }).unwrap();
    refetchRecs();
  };

  const handleDeleteRecipient = async (id: number) => {
    if (window.confirm('Удалить получателя?')) {
      await deleteRecipient(id).unwrap();
      refetchRecs();
    }
  };

  // --- Subscriptions ---
  const handleAddSubscription = async () => {
    if (!newSubscription.recipient_id || !newSubscription.publication_index || ![1,3,6].includes(newSubscription.duration_months)) {
      alert('Выберите корректного получателя, публикацию и срок подписки (1,3,6 мес.)');
      return;
    }
    await createSubscription(newSubscription).unwrap();
    setNewSubscription({
      recipient_id: recipients[0]?.id ?? 0,
      publication_index: publications[0]?.index ?? '',
      duration_months: 1,
      start_month: 1,
      start_year: new Date().getFullYear(),
    });
    refetchSubs();
  };

  const handleUpdateSubscription = async (id: number) => {
    const months = prompt('Введите новый срок подписки (1,3,6):');
    if (!months) return;
    await updateSubscription({ id, body: { duration_months: Number(months) } }).unwrap();
    refetchSubs();
  };

  const handleDeleteSubscription = async (id: number) => {
    if (window.confirm('Удалить подписку?')) {
      await deleteSubscription(id).unwrap();
      refetchSubs();
    }
  };

  // ===== Update subscription form defaults =====
  useEffect(() => {
    if (recipients.length && publications.length) {
      setNewSubscription({
        recipient_id: recipients[0].id,
        publication_index: publications[0].index,
        duration_months: 1,
        start_month: 1,
        start_year: new Date().getFullYear(),
      });
    }
  }, [recipients, publications]);

  // ===== Render =====
  return (
    <>
      <div className={styles.container}>
        {/* Publications */}
        <section className={styles.section}>
          <h2>Publications</h2>
          {pubsLoading ? <p>Loading...</p> :
            <ul className={styles.list}>
              {publications.map(pub => (
                <li key={pub.index}>
                  {pub.title} ({pub.type}) - {pub.monthly_cost}
                  <div>
                    <button className={`${styles.button} ${styles['button-update']}`} onClick={() => handleUpdatePublication(pub.index)}>Update</button>
                    <button className={`${styles.button} ${styles['button-delete']}`} onClick={() => handleDeletePublication(pub.index)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          }
          <div className={styles.form}>
            <input type="text" placeholder="Index" value={newPublication.index} onChange={e => setNewPublication({...newPublication, index: e.target.value})}/>
            <input type="text" placeholder="Title" value={newPublication.title} onChange={e => setNewPublication({...newPublication, title: e.target.value})}/>
            <select value={newPublication.type} onChange={e => setNewPublication({...newPublication, type: e.target.value})}>
              <option value="газета">газета</option>
              <option value="журнал">журнал</option>
            </select>
            <input type="number" placeholder="Cost" value={newPublication.monthly_cost} onChange={e => setNewPublication({...newPublication, monthly_cost: Number(e.target.value)})}/>
            <button className={`${styles.button} ${styles['button-add']}`} onClick={handleAddPublication}>Add</button>
          </div>
        </section>
  
        {/* Recipients */}
        <section className={styles.section}>
          <h2>Recipients</h2>
          {recsLoading ? <p>Loading...</p> :
            <ul className={styles.list}>
              {recipients.map(rec => (
                <li key={rec.id}>
                  {rec.full_name}, {rec.street} {rec.house}/{rec.apartment}
                  <div>
                    <button className={`${styles.button} ${styles['button-update']}`} onClick={() => handleUpdateRecipient(rec.id)}>Update</button>
                    <button className={`${styles.button} ${styles['button-delete']}`} onClick={() => handleDeleteRecipient(rec.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          }
          <div className={styles.form}>
            <input type="text" placeholder="Full Name" value={newRecipient.full_name} onChange={e => setNewRecipient({...newRecipient, full_name: e.target.value})}/>
            <input type="text" placeholder="Street" value={newRecipient.street} onChange={e => setNewRecipient({...newRecipient, street: e.target.value})}/>
            <input type="text" placeholder="House" value={newRecipient.house} onChange={e => setNewRecipient({...newRecipient, house: e.target.value})}/>
            <input type="text" placeholder="Apartment" value={newRecipient.apartment} onChange={e => setNewRecipient({...newRecipient, apartment: e.target.value})}/>
            <button className={`${styles.button} ${styles['button-add']}`} onClick={handleAddRecipient}>Add</button>
          </div>
        </section>
  
        {/* Subscriptions */}
        <section className={styles.section}>
          <h2>Subscriptions</h2>
          {subsLoading ? <p>Loading...</p> :
            <ul className={styles.list}>
              {subscriptions.map(sub => (
                <li key={sub.id}>
                  Recipient: {sub.recipient?.full_name ?? sub.recipient_id}, Publication: {sub.publication?.title ?? sub.publication_index}, Duration: {sub.duration_months} months
                  <div>
                    <button className={`${styles.button} ${styles['button-update']}`} onClick={() => handleUpdateSubscription(sub.id)}>Update</button>
                    <button className={`${styles.button} ${styles['button-delete']}`} onClick={() => handleDeleteSubscription(sub.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          }
          <div className={styles.form}>
            <select value={newSubscription.recipient_id} onChange={e => setNewSubscription({...newSubscription, recipient_id: Number(e.target.value)})}>
              {recipients.map(rec => <option key={rec.id} value={rec.id}>{rec.full_name}</option>)}
            </select>
            <select value={newSubscription.publication_index} onChange={e => setNewSubscription({...newSubscription, publication_index: e.target.value})}>
              {publications.map(pub => <option key={pub.index} value={pub.index}>{pub.title}</option>)}
            </select>
            <select value={newSubscription.duration_months} onChange={e => setNewSubscription({...newSubscription, duration_months: Number(e.target.value)})}>
              {[1,3,6].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="number" placeholder="Start Month" value={newSubscription.start_month} onChange={e => setNewSubscription({...newSubscription, start_month: Number(e.target.value)})}/>
            <input type="number" placeholder="Start Year" value={newSubscription.start_year} onChange={e => setNewSubscription({...newSubscription, start_year: Number(e.target.value)})}/>
            <button className={`${styles.button} ${styles['button-add']}`} onClick={handleAddSubscription}>Add</button>
          </div>
        </section>
      </div>
      <ApiTester />
    </>
  );
};

export default Article;
